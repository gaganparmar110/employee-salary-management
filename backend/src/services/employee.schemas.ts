import { z } from "zod";

export const payFrequencySchema = z.enum(["ANNUAL", "MONTHLY"]);
export const salaryChangeReasonSchema = z.enum([
  "HIRE",
  "RAISE",
  "ADJUSTMENT",
  "CURRENCY_CHANGE",
  "CORRECTION",
]);

export const createEmployeeSchema = z.object({
  employeeCode: z.string().min(1),
  fullName: z.string().min(1),
  department: z.string().min(1),
  country: z.string().min(1),
  currency: z.string().length(3),
  // No separate currency here on purpose: the first SalaryRecord's currency
  // is always the employee's currency, so there's nothing to reconcile.
  initialSalary: z.object({
    amount: z.number().positive(),
    payFrequency: payFrequencySchema,
    effectiveDate: z.coerce.date(),
  }),
});
export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;

export const updateSalarySchema = z.object({
  amount: z.number().positive(),
  currency: z.string().length(3),
  payFrequency: payFrequencySchema,
  effectiveDate: z.coerce.date(),
  // HIRE only happens via createEmployee.
  reason: salaryChangeReasonSchema.exclude(["HIRE"]),
});
export type UpdateSalaryInput = z.infer<typeof updateSalarySchema>;
