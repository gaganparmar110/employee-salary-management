import type { Db } from "../lib/prisma.js";
import type { PayFrequency, SalaryChangeReason, SalaryRecord } from "../domain/index.js";

function toDomainSalaryRecord(row: {
  id: string;
  employeeId: string;
  amount: { toString(): string };
  currency: string;
  payFrequency: PayFrequency;
  effectiveDate: Date;
  reason: SalaryChangeReason;
  changedById: string;
  createdAt: Date;
}): SalaryRecord {
  return {
    id: row.id,
    employeeId: row.employeeId,
    amount: row.amount.toString(),
    currency: row.currency,
    payFrequency: row.payFrequency,
    effectiveDate: row.effectiveDate,
    reason: row.reason,
    changedById: row.changedById,
    createdAt: row.createdAt,
  };
}

export interface InsertSalaryRecordData {
  employeeId: string;
  amount: string;
  currency: string;
  payFrequency: PayFrequency;
  effectiveDate: Date;
  reason: SalaryChangeReason;
  changedById: string;
}

// Deliberately no update/upsert sibling — appending is the only way to
// persist a SalaryRecord, which is what makes history append-only.
export async function insertSalaryRecord(db: Db, data: InsertSalaryRecordData): Promise<SalaryRecord> {
  const row = await db.salaryRecord.create({ data });
  return toDomainSalaryRecord(row);
}

export async function getSalaryHistory(
  db: Db,
  employeeId: string,
  params: { skip?: number; take?: number } = {},
): Promise<SalaryRecord[]> {
  const rows = await db.salaryRecord.findMany({
    where: { employeeId },
    orderBy: [{ effectiveDate: "desc" }, { createdAt: "desc" }],
    skip: params.skip,
    take: params.take,
  });
  return rows.map(toDomainSalaryRecord);
}

export async function getCurrentSalary(db: Db, employeeId: string): Promise<SalaryRecord | null> {
  const row = await db.salaryRecord.findFirst({
    where: { employeeId },
    orderBy: [{ effectiveDate: "desc" }, { createdAt: "desc" }],
  });
  return row ? toDomainSalaryRecord(row) : null;
}

export interface CurrentSalarySnapshot {
  employeeId: string;
  employeeCode: string;
  fullName: string;
  department: string;
  country: string;
  currency: string;
  amount: string;
}

// One employee-scale query for reporting: `distinct` + a matching `orderBy`
// compiles to a Postgres DISTINCT ON, giving exactly the latest
// SalaryRecord per employee (as of `asOfDate`, or now if omitted) in a
// single indexed pass — no N+1 queries across 10,000 employees. Reused for
// both current-state reports and point-in-time ones (pay-over-time).
export async function getSalariesSnapshot(db: Db, asOfDate?: Date): Promise<CurrentSalarySnapshot[]> {
  const rows = await db.salaryRecord.findMany({
    where: asOfDate ? { effectiveDate: { lte: asOfDate } } : undefined,
    distinct: ["employeeId"],
    orderBy: [{ employeeId: "asc" }, { effectiveDate: "desc" }, { createdAt: "desc" }],
    include: { employee: { select: { employeeCode: true, fullName: true, department: true, country: true } } },
  });

  return rows.map((row) => ({
    employeeId: row.employeeId,
    employeeCode: row.employee.employeeCode,
    fullName: row.employee.fullName,
    department: row.employee.department,
    country: row.employee.country,
    currency: row.currency,
    amount: row.amount.toString(),
  }));
}

// Anchors the period range for pay-over-time — the earliest point any
// salary history exists, so we don't generate empty years before the org
// had any data.
export async function getEarliestEffectiveDate(db: Db): Promise<Date | null> {
  const result = await db.salaryRecord.aggregate({ _min: { effectiveDate: true } });
  return result._min.effectiveDate;
}
