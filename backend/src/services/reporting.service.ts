import type { PrismaClient } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import * as salaryRecordRepo from "../repositories/salaryRecord.repository.js";
import {
  computeSalaryDistribution,
  pickTopAndBottomEarners,
  summarizeByDepartmentAndCountry,
  summarizeByGroup,
  summarizeOverall,
  type CurrencyEarnersReport,
  type CurrentSalarySnapshot,
  type DepartmentCountrySalarySummary,
  type GroupSalarySummary,
  type OverallSalarySummary,
  type SalaryBand,
} from "./reporting.js";

// Reporting reads current salary as a number — precision that matters
// (the ledger itself) stays as strings all the way through the repository
// layer; this is a read-only aggregate view, not a source of truth.
async function getSnapshot(db: PrismaClient, asOfDate?: Date): Promise<CurrentSalarySnapshot[]> {
  const rows = await salaryRecordRepo.getSalariesSnapshot(db, asOfDate);
  return rows.map((row) => ({ ...row, amount: Number(row.amount) }));
}

export async function getDepartmentReport(db: PrismaClient = prisma): Promise<GroupSalarySummary[]> {
  return summarizeByGroup(await getSnapshot(db), "department");
}

export async function getCountryReport(db: PrismaClient = prisma): Promise<GroupSalarySummary[]> {
  return summarizeByGroup(await getSnapshot(db), "country");
}

export async function getSalaryDistribution(db: PrismaClient = prisma, bandCount = 5): Promise<SalaryBand[]> {
  return computeSalaryDistribution(await getSnapshot(db), bandCount);
}

export interface DepartmentCountryFilter {
  department?: string;
  country?: string;
}

// The one view that can actually answer "average salary in Engineering in
// Germany" — summarizeByGroup alone would merge Germany and France
// together under EUR. Optional filters narrow the cross-tab down to a
// single row for a specific question instead of the whole table.
export async function getDepartmentCountryReport(
  filter: DepartmentCountryFilter = {},
  db: PrismaClient = prisma,
): Promise<DepartmentCountrySalarySummary[]> {
  const summaries = summarizeByDepartmentAndCountry(await getSnapshot(db));
  return summaries.filter(
    (s) =>
      (!filter.department || s.department === filter.department) &&
      (!filter.country || s.country === filter.country),
  );
}

// "How much are we spending overall?"
export async function getOverview(db: PrismaClient = prisma): Promise<OverallSalarySummary[]> {
  return summarizeOverall(await getSnapshot(db));
}

export interface TopEarnersFilter {
  currency?: string;
  limit?: number;
}

// "Who are the highest/lowest paid employees?"
export async function getTopEarners(
  filter: TopEarnersFilter = {},
  db: PrismaClient = prisma,
): Promise<CurrencyEarnersReport[]> {
  const snapshot = await getSnapshot(db);
  const filtered = filter.currency ? snapshot.filter((row) => row.currency === filter.currency) : snapshot;
  return pickTopAndBottomEarners(filtered, filter.limit ?? 5);
}

export interface PayOverTimeFilter {
  department?: string;
  country?: string;
}

export interface PayOverTimePeriod {
  period: string;
  summary: OverallSalarySummary[];
}

// "How has salary changed over time?" — reconstructs the same
// department/country-filtered, currency-safe totals used everywhere else
// in this file, but at year-end snapshots from the earliest salary record
// through today, instead of just "now".
export async function getPayOverTime(
  filter: PayOverTimeFilter = {},
  db: PrismaClient = prisma,
): Promise<PayOverTimePeriod[]> {
  const earliest = await salaryRecordRepo.getEarliestEffectiveDate(db);
  if (!earliest) return [];

  const startYear = earliest.getFullYear();
  const endYear = new Date().getFullYear();

  const periods: PayOverTimePeriod[] = [];
  for (let year = startYear; year <= endYear; year++) {
    const asOfDate = new Date(year, 11, 31, 23, 59, 59);
    const snapshot = await getSnapshot(db, asOfDate);
    const filtered = snapshot.filter(
      (row) =>
        (!filter.department || row.department === filter.department) &&
        (!filter.country || row.country === filter.country),
    );
    periods.push({ period: String(year), summary: summarizeOverall(filtered) });
  }

  return periods;
}
