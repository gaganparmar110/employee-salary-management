import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const pushMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, replace: vi.fn() }),
}));

import DashboardPage from "../app/dashboard/page";
import { useAuthStore } from "../store/authStore";

describe("DashboardPage", () => {
  beforeEach(() => {
    pushMock.mockClear();
    useAuthStore.setState({ token: "tok-1", hrManager: { id: "1", email: "hr@acme.test" } });
  });

  it("shows the logged-in HR manager's email", () => {
    render(<DashboardPage />);
    expect(screen.getAllByText(/hr@acme\.test/).length).toBeGreaterThan(0);
  });

  it("logs out and redirects to /login when Log out is clicked", async () => {
    const user = userEvent.setup();
    render(<DashboardPage />);

    await user.click(screen.getByRole("button", { name: /log out/i }));

    expect(useAuthStore.getState().token).toBeNull();
    expect(pushMock).toHaveBeenCalledWith("/login");
  });
});
