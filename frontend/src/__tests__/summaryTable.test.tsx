import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { SummaryTable } from "../components/reports/SummaryTable";

describe("SummaryTable", () => {
  it("renders a row per group with formatted currency values", () => {
    render(
      <SummaryTable
        groupLabel="Department"
        rows={[
          {
            group: "Engineering",
            currency: "GBP",
            headcount: 96,
            totalCost: 11665899.9,
            averageSalary: 121519.79,
            medianSalary: 121048.46,
          },
        ]}
      />,
    );

    expect(screen.getByText("Engineering")).toBeInTheDocument();
    expect(screen.getByText("GBP")).toBeInTheDocument();
    expect(screen.getByText("96")).toBeInTheDocument();
    expect(screen.getByRole("table")).toHaveTextContent(/121,5\d\d/);
  });

  it("shows an empty state when there are no rows", () => {
    render(<SummaryTable groupLabel="Department" rows={[]} />);
    expect(screen.getByText(/no data/i)).toBeInTheDocument();
  });

  function makeRows(count: number) {
    return Array.from({ length: count }, (_, i) => ({
      group: `Group ${i}`,
      currency: "GBP",
      headcount: 1,
      totalCost: 1000,
      averageSalary: 1000,
      medianSalary: 1000,
    }));
  }

  it("does not scroll-wrap the table at 10 rows or fewer", () => {
    render(<SummaryTable groupLabel="Department" rows={makeRows(10)} />);
    expect(screen.getByTestId("summary-table-scroll")).not.toHaveClass("overflow-y-auto");
  });

  it("scroll-wraps the table once there are more than 10 rows", () => {
    render(<SummaryTable groupLabel="Department" rows={makeRows(11)} />);
    expect(screen.getByTestId("summary-table-scroll")).toHaveClass("overflow-y-auto");
  });
});
