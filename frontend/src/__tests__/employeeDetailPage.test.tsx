import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useParams: () => ({ id: "e1" }),
}));

const getEmployeeMock = vi.fn();
const getSalaryHistoryMock = vi.fn();
const updateSalaryMock = vi.fn();

vi.mock("../lib/employeesApi", async () => {
  const actual = await vi.importActual<typeof import("../lib/employeesApi")>("../lib/employeesApi");
  return {
    ...actual,
    getEmployee: (...args: unknown[]) => getEmployeeMock(...args),
    getSalaryHistory: (...args: unknown[]) => getSalaryHistoryMock(...args),
    updateSalary: (...args: unknown[]) => updateSalaryMock(...args),
  };
});

import EmployeeDetailPage from "../app/employees/[id]/page";
import { useAuthStore } from "../store/authStore";

const baseEmployee = {
  id: "e1",
  employeeCode: "EMP-00001",
  fullName: "Ada Lovelace",
  department: "Engineering",
  country: "United Kingdom",
  currency: "GBP",
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
  currentSalary: {
    id: "s1",
    employeeId: "e1",
    amount: "90000",
    currency: "GBP",
    payFrequency: "ANNUAL" as const,
    effectiveDate: "2024-01-01T00:00:00.000Z",
    reason: "HIRE" as const,
    changedById: "m1",
    createdAt: "2024-01-01T00:00:00.000Z",
  },
};

const baseHistory = [baseEmployee.currentSalary];

describe("EmployeeDetailPage", () => {
  beforeEach(() => {
    useAuthStore.setState({ token: "tok-1", hrManager: { id: "1", email: "hr@acme.test" } });
    getEmployeeMock.mockReset().mockResolvedValue(baseEmployee);
    getSalaryHistoryMock.mockReset().mockResolvedValue(baseHistory);
    updateSalaryMock.mockReset();
  });

  it("fetches the employee and salary history on mount", async () => {
    render(<EmployeeDetailPage />);

    await waitFor(() => expect(getEmployeeMock).toHaveBeenCalledWith("tok-1", "e1"));
    expect(getSalaryHistoryMock).toHaveBeenCalledWith("tok-1", "e1");
  });

  it("renders the profile and current salary", async () => {
    render(<EmployeeDetailPage />);
    expect(await screen.findByText("Ada Lovelace")).toBeInTheDocument();
    expect(screen.getByText("EMP-00001")).toBeInTheDocument();
    expect((await screen.findAllByText(/90,000/)).length).toBeGreaterThan(0);
  });

  it("renders the salary history table", async () => {
    render(<EmployeeDetailPage />);
    expect((await screen.findAllByText("HIRE")).length).toBeGreaterThan(0);
  });

  it("submits an update-salary request and refreshes the data on success", async () => {
    updateSalaryMock.mockResolvedValue({
      current: { ...baseEmployee.currentSalary, id: "s2", amount: "95000", reason: "RAISE" },
      previous: baseEmployee.currentSalary,
    });
    const user = userEvent.setup();
    render(<EmployeeDetailPage />);
    await waitFor(() => expect(getEmployeeMock).toHaveBeenCalledTimes(1));

    await user.clear(screen.getByLabelText(/^amount$/i));
    await user.type(screen.getByLabelText(/^amount$/i), "95000");
    await user.clear(screen.getByLabelText(/^currency$/i));
    await user.type(screen.getByLabelText(/^currency$/i), "GBP");
    await user.type(screen.getByLabelText(/effective date/i), "2025-01-01");
    await user.selectOptions(screen.getByLabelText(/^reason$/i), "RAISE");
    await user.click(screen.getByRole("button", { name: /update salary/i }));

    await waitFor(() =>
      expect(updateSalaryMock).toHaveBeenCalledWith("tok-1", "e1", {
        amount: 95000,
        currency: "GBP",
        payFrequency: "ANNUAL",
        effectiveDate: "2025-01-01",
        reason: "RAISE",
      }),
    );
    expect(getEmployeeMock).toHaveBeenCalledTimes(2);
    expect(getSalaryHistoryMock).toHaveBeenCalledTimes(2);
    expect(await screen.findByText(/salary updated/i)).toBeInTheDocument();
  });

  it("shows an error message if updating salary fails", async () => {
    updateSalaryMock.mockRejectedValue(new Error("boom"));
    const user = userEvent.setup();
    render(<EmployeeDetailPage />);
    await waitFor(() => expect(getEmployeeMock).toHaveBeenCalledTimes(1));

    await user.clear(screen.getByLabelText(/^amount$/i));
    await user.type(screen.getByLabelText(/^amount$/i), "95000");
    await user.clear(screen.getByLabelText(/^currency$/i));
    await user.type(screen.getByLabelText(/^currency$/i), "GBP");
    await user.type(screen.getByLabelText(/effective date/i), "2025-01-01");
    await user.selectOptions(screen.getByLabelText(/^reason$/i), "RAISE");
    await user.click(screen.getByRole("button", { name: /update salary/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/failed to load/i);
  });
});
