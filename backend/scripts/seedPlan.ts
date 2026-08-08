// Pure data-generation logic for the seed script — no DB access here, so
// it's cheap to unit test (see backend/src/__tests__/seedPlan.test.ts) and
// easy to reason about independently of how the plans get persisted.
import { faker } from "@faker-js/faker";
import type { PayFrequency } from "../src/domain/index.js";

// Flat, fixed list per docs/REQUIREMENTS.pdf — no org-chart hierarchy in phase 1.
export const DEPARTMENTS = [
  "Engineering",
  "Sales",
  "Marketing",
  "Finance",
  "HR",
  "Operations",
  "Customer Support",
  "Legal",
  "Product",
  "Design",
] as const;

export interface CountryProfile {
  country: string;
  currency: string;
  payFrequency: PayFrequency;
  // A rough multiplier so generated local-currency amounts look plausible
  // (e.g. INR/JPY numbers land in the right order of magnitude) — not a
  // real FX rate. Live FX conversion is explicitly out of scope for phase 1.
  salaryScale: number;
}

export const COUNTRIES: CountryProfile[] = [
  { country: "United States", currency: "USD", payFrequency: "ANNUAL", salaryScale: 1 },
  { country: "United Kingdom", currency: "GBP", payFrequency: "ANNUAL", salaryScale: 0.8 },
  { country: "Germany", currency: "EUR", payFrequency: "MONTHLY", salaryScale: 0.85 },
  { country: "France", currency: "EUR", payFrequency: "MONTHLY", salaryScale: 0.8 },
  { country: "India", currency: "INR", payFrequency: "MONTHLY", salaryScale: 15 },
  { country: "Canada", currency: "CAD", payFrequency: "ANNUAL", salaryScale: 1.35 },
  { country: "Australia", currency: "AUD", payFrequency: "ANNUAL", salaryScale: 1.5 },
  { country: "Singapore", currency: "SGD", payFrequency: "MONTHLY", salaryScale: 1.35 },
  { country: "Japan", currency: "JPY", payFrequency: "MONTHLY", salaryScale: 50 },
  { country: "Brazil", currency: "BRL", payFrequency: "MONTHLY", salaryScale: 1.4 },
];

const DEPARTMENT_BASE_SALARY: Record<(typeof DEPARTMENTS)[number], [number, number]> = {
  Engineering: [90000, 160000],
  Sales: [60000, 120000],
  Marketing: [55000, 100000],
  Finance: [65000, 130000],
  HR: [50000, 95000],
  Operations: [50000, 90000],
  "Customer Support": [40000, 70000],
  Legal: [80000, 150000],
  Product: [85000, 150000],
  Design: [60000, 110000],
};

const DAY_MS = 1000 * 60 * 60 * 24;

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export interface SeedSalaryEvent {
  effectiveDate: Date;
  amount: number;
  currency: string;
  payFrequency: PayFrequency;
  reason: "RAISE" | "ADJUSTMENT" | "CURRENCY_CHANGE";
}

export interface SeedEmployeePlan {
  employeeCode: string;
  fullName: string;
  department: (typeof DEPARTMENTS)[number];
  country: string;
  currency: string;
  payFrequency: PayFrequency;
  hireDate: Date;
  hireAmount: number;
  history: SeedSalaryEvent[];
}

function planEmployee(index: number, today: Date): SeedEmployeePlan {
  const department = faker.helpers.arrayElement(DEPARTMENTS);
  const profile = faker.helpers.arrayElement(COUNTRIES);
  const [min, max] = DEPARTMENT_BASE_SALARY[department];

  const hireDate = faker.date.between({
    from: new Date(today.getFullYear() - 6, 0, 1),
    to: new Date(today.getTime() - DAY_MS * 400),
  });
  const hireAmount = round2(faker.number.float({ min, max }) * profile.salaryScale);

  const history: SeedSalaryEvent[] = [];
  let cursor = hireDate;
  let currentAmount = hireAmount;
  let currentProfile = profile;

  const raiseCount = faker.number.int({ min: 1, max: 3 });
  for (let i = 0; i < raiseCount; i++) {
    const earliestNext = new Date(cursor.getTime() + DAY_MS * 300);
    if (earliestNext >= today) break;

    const effectiveDate = faker.date.between({ from: earliestNext, to: today });
    currentAmount = round2(currentAmount * faker.number.float({ min: 1.03, max: 1.15 }));
    history.push({
      effectiveDate,
      amount: currentAmount,
      currency: currentProfile.currency,
      payFrequency: currentProfile.payFrequency,
      reason: faker.helpers.arrayElement(["RAISE", "RAISE", "RAISE", "ADJUSTMENT"]),
    });
    cursor = effectiveDate;
  }

  // A small slice of employees relocate — exercises the CURRENCY_CHANGE
  // path so seeded data actually demonstrates the append-only currency
  // rule, not just raises.
  if (history.length > 0 && faker.number.int({ min: 1, max: 100 }) <= 3) {
    const earliestNext = new Date(cursor.getTime() + DAY_MS * 200);
    if (earliestNext < today) {
      const toProfile = faker.helpers.arrayElement(COUNTRIES.filter((c) => c.currency !== currentProfile.currency));
      const effectiveDate = faker.date.between({ from: earliestNext, to: today });
      history.push({
        effectiveDate,
        amount: currentAmount,
        currency: toProfile.currency,
        payFrequency: toProfile.payFrequency,
        reason: "CURRENCY_CHANGE",
      });
      currentProfile = toProfile;
    }
  }

  return {
    employeeCode: `EMP-${String(index).padStart(5, "0")}`,
    fullName: faker.person.fullName(),
    department,
    country: profile.country,
    currency: profile.currency,
    payFrequency: profile.payFrequency,
    hireDate,
    hireAmount,
    history,
  };
}

// The one entry point callers use — owns seeding faker's RNG so the same
// (count, today, seed) always produces the exact same plans.
export function generateSeedPlans(count: number, today: Date, seed = 42): SeedEmployeePlan[] {
  faker.seed(seed);
  return Array.from({ length: count }, (_, i) => planEmployee(i + 1, today));
}
