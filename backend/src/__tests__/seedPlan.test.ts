import { describe, expect, it } from "vitest";
import { COUNTRIES, DEPARTMENTS, generateSeedPlans } from "../../scripts/seedPlan.js";

describe("seed plan generation", () => {
  const today = new Date("2026-08-08");

  it("is deterministic for a fixed seed", () => {
    const first = generateSeedPlans(50, today, 42);
    const second = generateSeedPlans(50, today, 42);
    expect(second).toEqual(first);
  });

  it("produces a different sequence for a different seed", () => {
    const a = generateSeedPlans(50, today, 42);
    const b = generateSeedPlans(50, today, 7);
    expect(b).not.toEqual(a);
  });

  it("produces unique employee codes", () => {
    const plans = generateSeedPlans(500, today, 42);
    const codes = new Set(plans.map((p) => p.employeeCode));
    expect(codes.size).toBe(plans.length);
  });

  it("only uses known departments and countries", () => {
    const plans = generateSeedPlans(500, today, 42);
    const countryNames = COUNTRIES.map((c) => c.country);
    for (const plan of plans) {
      expect(DEPARTMENTS).toContain(plan.department);
      expect(countryNames).toContain(plan.country);
    }
  });

  it("gives every employee a positive hire amount and a hire date in the past", () => {
    const plans = generateSeedPlans(500, today, 42);
    for (const plan of plans) {
      expect(plan.hireAmount).toBeGreaterThan(0);
      expect(plan.hireDate.getTime()).toBeLessThan(today.getTime());
    }
  });

  it("keeps history chronological, after hire, and never in the future", () => {
    const plans = generateSeedPlans(500, today, 42);
    for (const plan of plans) {
      let cursor = plan.hireDate;
      for (const event of plan.history) {
        expect(event.effectiveDate.getTime()).toBeGreaterThan(cursor.getTime());
        expect(event.effectiveDate.getTime()).toBeLessThan(today.getTime());
        cursor = event.effectiveDate;
      }
    }
  });

  it("only labels an event CURRENCY_CHANGE when the currency actually changes", () => {
    const plans = generateSeedPlans(500, today, 42);
    let sawCurrencyChange = false;
    for (const plan of plans) {
      let currentCurrency = plan.currency;
      for (const event of plan.history) {
        if (event.reason === "CURRENCY_CHANGE") {
          expect(event.currency).not.toBe(currentCurrency);
          sawCurrencyChange = true;
        } else {
          expect(event.currency).toBe(currentCurrency);
        }
        currentCurrency = event.currency;
      }
    }
    // With 500 employees at a ~3% chance each, expect to see at least one.
    expect(sawCurrencyChange).toBe(true);
  });
});
