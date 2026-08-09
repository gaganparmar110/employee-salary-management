import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

const getOverviewMock = vi.fn();
const getByDepartmentMock = vi.fn();
const getByCountryMock = vi.fn();
const getSalaryDistributionMock = vi.fn();
const getByDepartmentCountryMock = vi.fn();
const getTopEarnersMock = vi.fn();
const getPayOverTimeMock = vi.fn();

vi.mock("../lib/reportsApi", () => ({
  getOverview: (...args: unknown[]) => getOverviewMock(...args),
  getByDepartment: (...args: unknown[]) => getByDepartmentMock(...args),
  getByCountry: (...args: unknown[]) => getByCountryMock(...args),
  getSalaryDistribution: (...args: unknown[]) => getSalaryDistributionMock(...args),
  getByDepartmentCountry: (...args: unknown[]) => getByDepartmentCountryMock(...args),
  getTopEarners: (...args: unknown[]) => getTopEarnersMock(...args),
  getPayOverTime: (...args: unknown[]) => getPayOverTimeMock(...args),
}));

import ReportsPage from "../app/reports/page";
import { useAuthStore } from "../store/authStore";

function section(headingPattern: RegExp): HTMLElement {
  return screen.getByText(headingPattern).closest("section")!;
}

describe("ReportsPage", () => {
  beforeEach(() => {
    useAuthStore.setState({ token: "tok-1", hrManager: { id: "1", email: "hr@acme.test" } });

    getOverviewMock.mockReset().mockResolvedValue([
      { currency: "GBP", headcount: 1000, totalCost: 80000000, averageSalary: 80000, medianSalary: 78000 },
    ]);
    getByDepartmentMock.mockReset().mockResolvedValue([
      { group: "Engineering", currency: "GBP", headcount: 100, totalCost: 12000000, averageSalary: 120000, medianSalary: 118000 },
      { group: "Sales", currency: "GBP", headcount: 50, totalCost: 4000000, averageSalary: 80000, medianSalary: 78000 },
    ]);
    getByCountryMock.mockReset().mockResolvedValue([
      { group: "United Kingdom", currency: "GBP", headcount: 150, totalCost: 16000000, averageSalary: 106667, medianSalary: 100000 },
    ]);
    getSalaryDistributionMock.mockReset().mockResolvedValue([
      { currency: "GBP", min: 30000, max: 60000, count: 200 },
      { currency: "GBP", min: 60000, max: 90000, count: 500 },
    ]);
    getByDepartmentCountryMock.mockReset().mockResolvedValue([
      { department: "Engineering", country: "Germany", currency: "EUR", headcount: 96, totalCost: 11665899.9, averageSalary: 121519.79, medianSalary: 121048.46 },
    ]);
    getTopEarnersMock.mockReset().mockResolvedValue([
      {
        currency: "GBP",
        top: [{ employeeCode: "E1", fullName: "Berta Murray", department: "Engineering", country: "United Kingdom", amount: 165078.83 }],
        bottom: [{ employeeCode: "E2", fullName: "Matilda Terry", department: "Customer Support", country: "United Kingdom", amount: 33480.65 }],
      },
    ]);
    getPayOverTimeMock.mockReset().mockResolvedValue([
      { period: "2025", summary: [{ currency: "GBP", headcount: 900, totalCost: 70000000, averageSalary: 77000, medianSalary: 75000 }] },
      { period: "2026", summary: [{ currency: "GBP", headcount: 1000, totalCost: 80000000, averageSalary: 80000, medianSalary: 78000 }] },
    ]);
  });

  it("fetches nothing until a question is clicked", () => {
    render(<ReportsPage />);

    expect(getOverviewMock).not.toHaveBeenCalled();
    expect(getByDepartmentMock).not.toHaveBeenCalled();
    expect(getByCountryMock).not.toHaveBeenCalled();
    expect(getSalaryDistributionMock).not.toHaveBeenCalled();
    expect(getByDepartmentCountryMock).not.toHaveBeenCalled();
    expect(getTopEarnersMock).not.toHaveBeenCalled();
    expect(getPayOverTimeMock).not.toHaveBeenCalled();
  });

  it("fetches the overview only when its button is clicked", async () => {
    const user = userEvent.setup();
    render(<ReportsPage />);

    await user.click(within(section(/spending overall/i)).getByRole("button", { name: /show overview/i }));

    await waitFor(() => expect(getOverviewMock).toHaveBeenCalledWith("tok-1"));
    expect(await screen.findByText(/80,000,000/)).toBeInTheDocument();
    expect(getByDepartmentMock).not.toHaveBeenCalled();
  });

  it("fetches by-department only when its button is clicked", async () => {
    const user = userEvent.setup();
    render(<ReportsPage />);

    await user.click(within(section(/most expensive/i)).getByRole("button", { name: /show departments/i }));

    await waitFor(() => expect(getByDepartmentMock).toHaveBeenCalledWith("tok-1"));
    expect((await screen.findAllByText("Engineering")).length).toBeGreaterThan(0);
  });

  it("fetches the department+country answer with the typed filters", async () => {
    const user = userEvent.setup();
    render(<ReportsPage />);

    const fairnessSection = section(/paying fairly across countries/i);
    await user.type(within(fairnessSection).getByLabelText(/department/i), "Engineering");
    await user.click(within(fairnessSection).getByRole("button", { name: /show/i }));

    await waitFor(() =>
      expect(getByDepartmentCountryMock).toHaveBeenCalledWith("tok-1", { department: "Engineering", country: undefined }),
    );
    expect(await screen.findByText("Germany")).toBeInTheDocument();
  });

  it("fetches top/bottom earners for the typed currency", async () => {
    const user = userEvent.setup();
    render(<ReportsPage />);

    const earnersSection = section(/highest\/lowest paid/i);
    await user.click(within(earnersSection).getByRole("button", { name: /show/i }));

    await waitFor(() => expect(getTopEarnersMock).toHaveBeenCalledWith("tok-1", { currency: undefined, limit: 5 }));
    expect(await screen.findByText("Berta Murray")).toBeInTheDocument();
    expect(screen.getByText("Matilda Terry")).toBeInTheDocument();
  });

  it("fetches the salary distribution when requested", async () => {
    const user = userEvent.setup();
    render(<ReportsPage />);

    await user.click(within(section(/what does our salary distribution/i)).getByRole("button", { name: /show distribution/i }));

    await waitFor(() => expect(getSalaryDistributionMock).toHaveBeenCalledWith("tok-1", 5));
    expect(await screen.findByText("GBP")).toBeInTheDocument();
  });

  it("fetches the pay-over-time trend when requested", async () => {
    const user = userEvent.setup();
    render(<ReportsPage />);

    await user.click(screen.getByRole("button", { name: /show trend/i }));

    await waitFor(() => expect(getPayOverTimeMock).toHaveBeenCalledWith("tok-1", { department: undefined, country: undefined }));
    expect(await screen.findByText("2025")).toBeInTheDocument();
    expect(screen.getByText("2026")).toBeInTheDocument();
  });

  it("shows an error message if a report fails to load, without blocking other sections", async () => {
    getOverviewMock.mockReset().mockRejectedValue(new Error("network down"));
    const user = userEvent.setup();
    render(<ReportsPage />);

    await user.click(within(section(/spending overall/i)).getByRole("button", { name: /show overview/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/failed to load/i);
  });
});
