import { describe, expect, it } from "vitest";
import {
  computeSalaryDistribution,
  pickTopAndBottomEarners,
  summarizeByDepartmentAndCountry,
  summarizeByGroup,
  summarizeOverall,
  type CurrentSalarySnapshot,
} from "../services/reporting.js";

let snapshotCounter = 0;

function snapshot(overrides: Partial<CurrentSalarySnapshot>): CurrentSalarySnapshot {
  snapshotCounter += 1;
  return {
    employeeId: `emp-${snapshotCounter}`,
    employeeCode: `EMP-${String(snapshotCounter).padStart(3, "0")}`,
    fullName: `Employee ${snapshotCounter}`,
    department: "Engineering",
    country: "UK",
    currency: "GBP",
    amount: 90000,
    ...overrides,
  };
}

describe("summarizeByGroup", () => {
  it("computes headcount, total cost, average, and median within a group", () => {
    const rows = [
      snapshot({ amount: 80000 }),
      snapshot({ amount: 90000 }),
      snapshot({ amount: 100000 }),
    ];

    const [summary] = summarizeByGroup(rows, "department");

    expect(summary.group).toBe("Engineering");
    expect(summary.headcount).toBe(3);
    expect(summary.totalCost).toBe(270000);
    expect(summary.averageSalary).toBe(90000);
    expect(summary.medianSalary).toBe(90000);
  });

  it("averages an even-sized group as the mean of the two middle values", () => {
    const rows = [snapshot({ amount: 80000 }), snapshot({ amount: 100000 })];
    const [summary] = summarizeByGroup(rows, "department");
    expect(summary.medianSalary).toBe(90000);
  });

  it("never mixes amounts across currencies within the same department", () => {
    const rows = [
      snapshot({ department: "Engineering", currency: "GBP", amount: 90000 }),
      snapshot({ department: "Engineering", currency: "USD", amount: 120000 }),
    ];

    const summaries = summarizeByGroup(rows, "department");

    expect(summaries).toHaveLength(2);
    const gbp = summaries.find((s) => s.currency === "GBP");
    const usd = summaries.find((s) => s.currency === "USD");
    expect(gbp?.headcount).toBe(1);
    expect(usd?.headcount).toBe(1);
    expect(gbp?.totalCost).toBe(90000);
    expect(usd?.totalCost).toBe(120000);
  });

  it("groups by country instead of department when asked", () => {
    const rows = [
      snapshot({ country: "UK", amount: 90000 }),
      snapshot({ country: "Germany", currency: "EUR", amount: 70000 }),
    ];

    const summaries = summarizeByGroup(rows, "country");

    expect(summaries.map((s) => s.group).sort()).toEqual(["Germany", "UK"]);
  });
});

describe("summarizeByDepartmentAndCountry", () => {
  it("keeps countries separate even when they share a currency", () => {
    const rows = [
      snapshot({ department: "Engineering", country: "Germany", currency: "EUR", amount: 90000 }),
      snapshot({ department: "Engineering", country: "France", currency: "EUR", amount: 70000 }),
    ];

    const summaries = summarizeByDepartmentAndCountry(rows);

    expect(summaries).toHaveLength(2);
    const germany = summaries.find((s) => s.country === "Germany");
    const france = summaries.find((s) => s.country === "France");
    expect(germany?.averageSalary).toBe(90000);
    expect(france?.averageSalary).toBe(70000);
  });

  it("answers the literal 'average salary in Engineering in Germany' question", () => {
    const rows = [
      snapshot({ department: "Engineering", country: "Germany", currency: "EUR", amount: 80000 }),
      snapshot({ department: "Engineering", country: "Germany", currency: "EUR", amount: 100000 }),
      snapshot({ department: "Sales", country: "Germany", currency: "EUR", amount: 60000 }),
      snapshot({ department: "Engineering", country: "France", currency: "EUR", amount: 200000 }),
    ];

    const summaries = summarizeByDepartmentAndCountry(rows);
    const answer = summaries.find((s) => s.department === "Engineering" && s.country === "Germany");

    // Not influenced by Sales/Germany or Engineering/France — a plain
    // by-department (or by-country) view would have blended one of these in.
    expect(answer?.headcount).toBe(2);
    expect(answer?.averageSalary).toBe(90000);
  });
});

describe("summarizeOverall", () => {
  it("totals headcount and cost company-wide, per currency, with no department/country split", () => {
    const rows = [
      snapshot({ department: "Engineering", country: "UK", currency: "GBP", amount: 80000 }),
      snapshot({ department: "Sales", country: "Germany", currency: "GBP", amount: 100000 }),
      snapshot({ department: "Finance", country: "France", currency: "EUR", amount: 60000 }),
    ];

    const summaries = summarizeOverall(rows);

    expect(summaries).toHaveLength(2);
    const gbp = summaries.find((s) => s.currency === "GBP");
    const eur = summaries.find((s) => s.currency === "EUR");
    expect(gbp?.headcount).toBe(2);
    expect(gbp?.totalCost).toBe(180000);
    expect(eur?.headcount).toBe(1);
    expect(eur?.totalCost).toBe(60000);
  });
});

describe("pickTopAndBottomEarners", () => {
  it("ranks top and bottom earners within a currency, highest/lowest first", () => {
    const rows = [
      snapshot({ fullName: "Low Earner", amount: 40000 }),
      snapshot({ fullName: "Mid Earner", amount: 70000 }),
      snapshot({ fullName: "High Earner", amount: 120000 }),
    ];

    const [report] = pickTopAndBottomEarners(rows, 2);

    expect(report.top.map((e) => e.fullName)).toEqual(["High Earner", "Mid Earner"]);
    expect(report.bottom.map((e) => e.fullName)).toEqual(["Low Earner", "Mid Earner"]);
  });

  it("never ranks across currencies together", () => {
    const rows = [
      snapshot({ currency: "JPY", fullName: "Nominal Big Number", amount: 8000000 }),
      snapshot({ currency: "GBP", fullName: "Actually Paid More", amount: 150000 }),
    ];

    const reports = pickTopAndBottomEarners(rows, 5);

    expect(reports).toHaveLength(2);
    const jpy = reports.find((r) => r.currency === "JPY");
    const gbp = reports.find((r) => r.currency === "GBP");
    expect(jpy?.top).toHaveLength(1);
    expect(gbp?.top).toHaveLength(1);
  });

  it("respects the limit and doesn't error when a currency has fewer employees than the limit", () => {
    const rows = [snapshot({ amount: 90000 }), snapshot({ amount: 95000 })];
    const [report] = pickTopAndBottomEarners(rows, 5);
    expect(report.top).toHaveLength(2);
    expect(report.bottom).toHaveLength(2);
  });
});

describe("computeSalaryDistribution", () => {
  it("buckets amounts within a currency into the requested number of equal-width bands", () => {
    const rows: CurrentSalarySnapshot[] = [0, 25, 50, 75, 100].map((amount) => snapshot({ amount }));

    const bands = computeSalaryDistribution(rows, 5);

    expect(bands).toHaveLength(5);
    expect(bands.reduce((sum, b) => sum + b.count, 0)).toBe(5);
    expect(bands[0].min).toBe(0);
    expect(bands[4].max).toBe(100);
  });

  it("keeps each currency's bands independent, based on its own min/max", () => {
    const rows = [
      snapshot({ currency: "GBP", amount: 80000 }),
      snapshot({ currency: "GBP", amount: 120000 }),
      snapshot({ currency: "INR", amount: 1500000 }),
      snapshot({ currency: "INR", amount: 2500000 }),
    ];

    const bands = computeSalaryDistribution(rows, 2);

    const gbpBands = bands.filter((b) => b.currency === "GBP");
    const inrBands = bands.filter((b) => b.currency === "INR");
    expect(gbpBands.reduce((sum, b) => sum + b.count, 0)).toBe(2);
    expect(inrBands.reduce((sum, b) => sum + b.count, 0)).toBe(2);
    expect(gbpBands[0].max).toBeLessThan(inrBands[0].min);
  });

  it("puts a single repeated amount entirely in one band instead of dividing by zero", () => {
    const rows = [snapshot({ amount: 90000 }), snapshot({ amount: 90000 }), snapshot({ amount: 90000 })];
    const bands = computeSalaryDistribution(rows, 5);
    expect(bands.reduce((sum, b) => sum + b.count, 0)).toBe(3);
  });
});
