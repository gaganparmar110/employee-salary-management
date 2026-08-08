// Pure aggregation math — no DB access, so it's cheap to unit test (see
// backend/src/__tests__/reporting.test.ts). reporting.service.ts is the
// thin wrapper that fetches CurrentSalarySnapshot rows and hands them here.
//
// Every function groups by currency alongside whatever dimension is
// requested. Amounts are never summed/averaged across currencies — doing
// so would silently mix units, which is exactly what the append-only
// (amount, currency) design elsewhere in this app exists to prevent (see
// docs/ARCHITECTURE.md). A department or country with employees paid in
// two currencies (e.g. after a relocation) simply produces two rows.

export interface CurrentSalarySnapshot {
  employeeId: string;
  employeeCode: string;
  fullName: string;
  department: string;
  country: string;
  currency: string;
  amount: number;
}

export interface GroupSalarySummary {
  group: string;
  currency: string;
  headcount: number;
  totalCost: number;
  averageSalary: number;
  medianSalary: number;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function median(sortedAmounts: number[]): number {
  const mid = Math.floor(sortedAmounts.length / 2);
  return sortedAmounts.length % 2 === 0
    ? (sortedAmounts[mid - 1] + sortedAmounts[mid]) / 2
    : sortedAmounts[mid];
}

interface AmountStats {
  headcount: number;
  totalCost: number;
  averageSalary: number;
  medianSalary: number;
}

function computeAmountStats(amounts: number[]): AmountStats {
  const sorted = [...amounts].sort((a, b) => a - b);
  const totalCost = sorted.reduce((sum, amount) => sum + amount, 0);
  return {
    headcount: sorted.length,
    totalCost: round2(totalCost),
    averageSalary: round2(totalCost / sorted.length),
    medianSalary: round2(median(sorted)),
  };
}

export function summarizeByGroup(
  rows: CurrentSalarySnapshot[],
  groupBy: "department" | "country",
): GroupSalarySummary[] {
  const buckets = new Map<string, { group: string; currency: string; amounts: number[] }>();

  for (const row of rows) {
    const group = row[groupBy];
    const key = `${group}::${row.currency}`;
    const bucket = buckets.get(key);
    if (bucket) {
      bucket.amounts.push(row.amount);
    } else {
      buckets.set(key, { group, currency: row.currency, amounts: [row.amount] });
    }
  }

  return Array.from(buckets.values())
    .map(({ group, currency, amounts }) => ({ group, currency, ...computeAmountStats(amounts) }))
    .sort((a, b) => a.group.localeCompare(b.group) || a.currency.localeCompare(b.currency));
}

export interface DepartmentCountrySalarySummary {
  department: string;
  country: string;
  currency: string;
  headcount: number;
  totalCost: number;
  averageSalary: number;
  medianSalary: number;
}

// The combined view — grouping by department OR country alone isn't
// enough to answer "average salary in Engineering in Germany," since
// countries that share a currency (e.g. Germany and France, both EUR)
// would otherwise get merged together under summarizeByGroup.
export function summarizeByDepartmentAndCountry(
  rows: CurrentSalarySnapshot[],
): DepartmentCountrySalarySummary[] {
  const buckets = new Map<
    string,
    { department: string; country: string; currency: string; amounts: number[] }
  >();

  for (const row of rows) {
    const key = `${row.department}::${row.country}::${row.currency}`;
    const bucket = buckets.get(key);
    if (bucket) {
      bucket.amounts.push(row.amount);
    } else {
      buckets.set(key, {
        department: row.department,
        country: row.country,
        currency: row.currency,
        amounts: [row.amount],
      });
    }
  }

  return Array.from(buckets.values())
    .map(({ department, country, currency, amounts }) => ({
      department,
      country,
      currency,
      ...computeAmountStats(amounts),
    }))
    .sort(
      (a, b) =>
        a.department.localeCompare(b.department) ||
        a.country.localeCompare(b.country) ||
        a.currency.localeCompare(b.currency),
    );
}

export interface OverallSalarySummary {
  currency: string;
  headcount: number;
  totalCost: number;
  averageSalary: number;
  medianSalary: number;
}

// "How much are we spending overall?" — the honest answer is per currency,
// not one blended number (that would require an FX conversion this app
// deliberately doesn't do). Company-wide totals with no department/country
// split.
export function summarizeOverall(rows: CurrentSalarySnapshot[]): OverallSalarySummary[] {
  const byCurrency = new Map<string, number[]>();
  for (const row of rows) {
    const amounts = byCurrency.get(row.currency);
    if (amounts) {
      amounts.push(row.amount);
    } else {
      byCurrency.set(row.currency, [row.amount]);
    }
  }

  return Array.from(byCurrency.entries())
    .map(([currency, amounts]) => ({ currency, ...computeAmountStats(amounts) }))
    .sort((a, b) => a.currency.localeCompare(b.currency));
}

export interface EarnerEntry {
  employeeCode: string;
  fullName: string;
  department: string;
  country: string;
  amount: number;
}

export interface CurrencyEarnersReport {
  currency: string;
  top: EarnerEntry[];
  bottom: EarnerEntry[];
}

function toEarnerEntry(row: CurrentSalarySnapshot): EarnerEntry {
  return {
    employeeCode: row.employeeCode,
    fullName: row.fullName,
    department: row.department,
    country: row.country,
    amount: row.amount,
  };
}

// "Who are the highest/lowest paid employees?" — grouped by currency for
// the same reason as everything else here: ranking a JPY nominal salary
// against a GBP one would just reward whichever currency has bigger
// numbers, not whoever is actually paid more.
export function pickTopAndBottomEarners(
  rows: CurrentSalarySnapshot[],
  limit = 5,
): CurrencyEarnersReport[] {
  const byCurrency = new Map<string, CurrentSalarySnapshot[]>();
  for (const row of rows) {
    const list = byCurrency.get(row.currency);
    if (list) {
      list.push(row);
    } else {
      byCurrency.set(row.currency, [row]);
    }
  }

  return Array.from(byCurrency.entries())
    .map(([currency, currencyRows]) => {
      const sortedDesc = [...currencyRows].sort((a, b) => b.amount - a.amount);
      return {
        currency,
        top: sortedDesc.slice(0, limit).map(toEarnerEntry),
        bottom: sortedDesc.slice(-limit).reverse().map(toEarnerEntry),
      };
    })
    .sort((a, b) => a.currency.localeCompare(b.currency));
}

export interface SalaryBand {
  currency: string;
  min: number;
  max: number;
  count: number;
}

// Equal-width bins computed from each currency's own observed min/max —
// deliberately not fixed dollar thresholds, since a "$50k" cutoff means
// nothing for a currency like JPY or INR.
export function computeSalaryDistribution(
  rows: CurrentSalarySnapshot[],
  bandCount = 5,
): SalaryBand[] {
  const byCurrency = new Map<string, number[]>();
  for (const row of rows) {
    const amounts = byCurrency.get(row.currency);
    if (amounts) {
      amounts.push(row.amount);
    } else {
      byCurrency.set(row.currency, [row.amount]);
    }
  }

  const bands: SalaryBand[] = [];
  for (const [currency, amounts] of byCurrency) {
    const min = Math.min(...amounts);
    const max = Math.max(...amounts);
    const width = (max - min) / bandCount || 1;
    const counts = new Array(bandCount).fill(0) as number[];

    for (const amount of amounts) {
      const index = Math.min(bandCount - 1, Math.floor((amount - min) / width));
      counts[index] += 1;
    }

    for (let i = 0; i < bandCount; i++) {
      bands.push({
        currency,
        min: round2(min + i * width),
        max: round2(min + (i + 1) * width),
        count: counts[i],
      });
    }
  }

  return bands;
}
