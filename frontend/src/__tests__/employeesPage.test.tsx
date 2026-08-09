import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

const listEmployeesMock = vi.fn();
vi.mock("../lib/employeesApi", () => ({
  listEmployees: (...args: unknown[]) => listEmployeesMock(...args),
}));

import EmployeesPage from "../app/employees/page";
import { useAuthStore } from "../store/authStore";

function makeEmployee(overrides: Partial<{ id: string; employeeCode: string; fullName: string }> = {}) {
  return {
    id: overrides.id ?? "e1",
    employeeCode: overrides.employeeCode ?? "EMP-00001",
    fullName: overrides.fullName ?? "Ada Lovelace",
    department: "Engineering",
    country: "United Kingdom",
    currency: "GBP",
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
  };
}

describe("EmployeesPage", () => {
  beforeEach(() => {
    useAuthStore.setState({ token: "tok-1", hrManager: { id: "1", email: "hr@acme.test" } });
    listEmployeesMock.mockReset().mockResolvedValue({
      items: [makeEmployee()],
      total: 1,
      page: 1,
      pageSize: 20,
    });
  });

  it("fetches page 1 with no filters on mount", async () => {
    render(<EmployeesPage />);

    await waitFor(() =>
      expect(listEmployeesMock).toHaveBeenCalledWith("tok-1", {
        search: "",
        department: "",
        country: "",
        page: 1,
        pageSize: 20,
      }),
    );
  });

  it("renders the returned employees", async () => {
    render(<EmployeesPage />);
    expect(await screen.findByText("Ada Lovelace")).toBeInTheDocument();
    expect(screen.getByText("EMP-00001")).toBeInTheDocument();
  });

  it("searches with the entered filters and resets to page 1", async () => {
    const user = userEvent.setup();
    render(<EmployeesPage />);
    await waitFor(() => expect(listEmployeesMock).toHaveBeenCalledTimes(1));

    await user.type(screen.getByLabelText(/name or employee code/i), "Ada");
    await user.type(screen.getByLabelText(/department/i), "Engineering");
    await user.type(screen.getByLabelText(/country/i), "Germany");
    await user.click(screen.getByRole("button", { name: /^search$/i }));

    await waitFor(() =>
      expect(listEmployeesMock).toHaveBeenLastCalledWith("tok-1", {
        search: "Ada",
        department: "Engineering",
        country: "Germany",
        page: 1,
        pageSize: 20,
      }),
    );
  });

  it("paginates forward and back", async () => {
    listEmployeesMock.mockResolvedValue({
      items: [makeEmployee()],
      total: 45,
      page: 1,
      pageSize: 20,
    });
    const user = userEvent.setup();
    render(<EmployeesPage />);
    await waitFor(() => expect(listEmployeesMock).toHaveBeenCalledTimes(1));

    expect(screen.getByRole("button", { name: /previous/i })).toBeDisabled();

    await user.click(screen.getByRole("button", { name: /^next$/i }));
    await waitFor(() =>
      expect(listEmployeesMock).toHaveBeenLastCalledWith("tok-1", {
        search: "",
        department: "",
        country: "",
        page: 2,
        pageSize: 20,
      }),
    );
  });

  it("shows a message when there are no results", async () => {
    listEmployeesMock.mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 20 });
    render(<EmployeesPage />);
    expect(await screen.findByText(/no employees found/i)).toBeInTheDocument();
  });

  it("shows an error message if the fetch fails", async () => {
    listEmployeesMock.mockReset().mockRejectedValue(new Error("network down"));
    render(<EmployeesPage />);
    expect(await screen.findByRole("alert")).toHaveTextContent(/failed to load/i);
  });

  it("shows skeleton rows while the initial page is loading", async () => {
    let resolveFetch: (value: unknown) => void = () => {};
    listEmployeesMock.mockReset().mockReturnValue(
      new Promise((resolve) => {
        resolveFetch = resolve;
      }),
    );

    render(<EmployeesPage />);

    expect(screen.getAllByRole("row").length).toBeGreaterThan(1);
    expect(screen.queryByText("Ada Lovelace")).not.toBeInTheDocument();

    resolveFetch({ items: [makeEmployee()], total: 1, page: 1, pageSize: 20 });
    expect(await screen.findByText("Ada Lovelace")).toBeInTheDocument();
  });

  it("links each employee row to their detail page", async () => {
    render(<EmployeesPage />);
    const link = await screen.findByRole("link", { name: "Ada Lovelace" });
    expect(link).toHaveAttribute("href", "/employees/e1");
  });
});
