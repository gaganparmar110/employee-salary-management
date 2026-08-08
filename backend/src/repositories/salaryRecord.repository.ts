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
