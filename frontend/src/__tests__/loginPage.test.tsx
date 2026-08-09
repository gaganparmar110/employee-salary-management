import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const pushMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, replace: vi.fn() }),
}));

const loginMock = vi.fn();
vi.mock("../lib/authApi", () => ({
  login: (...args: unknown[]) => loginMock(...args),
}));

import LoginPage from "../app/login/page";
import { useAuthStore } from "../store/authStore";
import { ApiRequestError } from "../lib/apiClient";

describe("LoginPage", () => {
  beforeEach(() => {
    pushMock.mockClear();
    loginMock.mockReset();
    useAuthStore.setState({ token: null, hrManager: null });
  });

  it("renders email and password fields", () => {
    render(<LoginPage />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
  });

  it("toggles the password field between hidden and visible", async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    const passwordInput = screen.getByLabelText(/^password$/i);
    expect(passwordInput).toHaveAttribute("type", "password");

    await user.click(screen.getByRole("button", { name: /show password/i }));
    expect(passwordInput).toHaveAttribute("type", "text");

    await user.click(screen.getByRole("button", { name: /hide password/i }));
    expect(passwordInput).toHaveAttribute("type", "password");
  });

  it("logs in and redirects on success", async () => {
    loginMock.mockResolvedValue({ token: "tok-1", hrManager: { id: "1", email: "hr@acme.test" } });
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.type(screen.getByLabelText(/email/i), "hr@acme.test");
    await user.type(screen.getByLabelText(/^password$/i), "correct-horse");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    expect(loginMock).toHaveBeenCalledWith("hr@acme.test", "correct-horse");
    expect(useAuthStore.getState().token).toBe("tok-1");
    expect(pushMock).toHaveBeenCalledWith("/dashboard");
  });

  it("shows the error message and does not redirect on failure", async () => {
    loginMock.mockRejectedValue(new ApiRequestError("Invalid email or password", 401));
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.type(screen.getByLabelText(/email/i), "hr@acme.test");
    await user.type(screen.getByLabelText(/^password$/i), "wrong");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Invalid email or password");
    expect(pushMock).not.toHaveBeenCalled();
    expect(useAuthStore.getState().token).toBeNull();
  });
});
