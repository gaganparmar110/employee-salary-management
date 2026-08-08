import type { PayFrequency, SalaryChangeReason } from "@prisma/client";

export type { PayFrequency, SalaryChangeReason };

export interface SalaryRecord {
  id: string;
  employeeId: string;
  // Prisma's Decimal never leaves the repository layer — represented as a
  // string here so no precision is lost converting to/from a JS number.
  amount: string;
  currency: string;
  payFrequency: PayFrequency;
  effectiveDate: Date;
  reason: SalaryChangeReason;
  changedById: string;
  createdAt: Date;
}
