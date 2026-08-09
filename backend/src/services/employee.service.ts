import type { PrismaClient } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import * as employeeRepo from "../repositories/employee.repository.js";
import * as salaryRecordRepo from "../repositories/salaryRecord.repository.js";
import {
  createEmployeeSchema,
  updateSalarySchema,
  type CreateEmployeeInput,
  type UpdateSalaryInput,
} from "./employee.schemas.js";
import { DomainError, NotFoundError } from "./errors.js";
import type { Employee, EmployeeWithCurrentSalary, SalaryRecord } from "../domain/index.js";

// Prisma's $transaction defaults (maxWait: 2s to acquire a connection,
// timeout: 5s to finish) are tight for anything but a low-latency local
// DB — comfortable margin for real-world network variance without being
// so long a stuck transaction could pile up under load.
const TRANSACTION_OPTIONS = { maxWait: 10_000, timeout: 20_000 };

export interface CreateEmployeeResult {
  employee: Employee;
  salaryRecord: SalaryRecord;
}

// The one write path for bringing an employee into the system — manual
// CRUD, bulk import, and the seed script all call this, never the
// repository directly, so validation and history-writing never diverge.
export async function createEmployee(
  input: CreateEmployeeInput,
  actingManagerId: string,
  db: PrismaClient = prisma,
): Promise<CreateEmployeeResult> {
  const parsed = createEmployeeSchema.parse(input);

  return db.$transaction(async (tx) => {
    const employee = await employeeRepo.createEmployee(tx, {
      employeeCode: parsed.employeeCode,
      fullName: parsed.fullName,
      department: parsed.department,
      country: parsed.country,
      currency: parsed.currency,
    });

    const salaryRecord = await salaryRecordRepo.insertSalaryRecord(tx, {
      employeeId: employee.id,
      amount: parsed.initialSalary.amount.toString(),
      currency: employee.currency,
      payFrequency: parsed.initialSalary.payFrequency,
      effectiveDate: parsed.initialSalary.effectiveDate,
      reason: "HIRE",
      changedById: actingManagerId,
    });

    return { employee, salaryRecord };
  }, TRANSACTION_OPTIONS);
}

export interface UpdateSalaryResult {
  current: SalaryRecord;
  previous: SalaryRecord | null;
}

// The one write path for every salary change after hire — always appends,
// never mutates a prior SalaryRecord.
export async function updateSalary(
  employeeId: string,
  input: UpdateSalaryInput,
  actingManagerId: string,
  db: PrismaClient = prisma,
): Promise<UpdateSalaryResult> {
  const parsed = updateSalarySchema.parse(input);

  const employee = await employeeRepo.findEmployeeById(db, employeeId);
  if (!employee) {
    throw new NotFoundError(`Employee ${employeeId} not found`);
  }

  const previous = await salaryRecordRepo.getCurrentSalary(db, employeeId);

  // Enforces "a currency change is its own SalaryRecord, never a silent
  // conversion": the reason and the actual currency delta must agree.
  if (previous) {
    const currencyChanged = parsed.currency !== previous.currency;
    if (parsed.reason === "CURRENCY_CHANGE" && !currencyChanged) {
      throw new DomainError("CURRENCY_CHANGE requires a currency different from the current one");
    }
    if (parsed.reason !== "CURRENCY_CHANGE" && currencyChanged) {
      throw new DomainError(`Currency change requires reason CURRENCY_CHANGE, got ${parsed.reason}`);
    }
  }

  const current = await db.$transaction(async (tx) => {
    const record = await salaryRecordRepo.insertSalaryRecord(tx, {
      employeeId,
      amount: parsed.amount.toString(),
      currency: parsed.currency,
      payFrequency: parsed.payFrequency,
      effectiveDate: parsed.effectiveDate,
      reason: parsed.reason,
      changedById: actingManagerId,
    });

    if (parsed.reason === "CURRENCY_CHANGE") {
      await employeeRepo.updateEmployeeCurrency(tx, employeeId, parsed.currency);
    }

    return record;
  }, TRANSACTION_OPTIONS);

  return { current, previous };
}

export async function getEmployee(
  id: string,
  db: PrismaClient = prisma,
): Promise<EmployeeWithCurrentSalary | null> {
  const employee = await employeeRepo.findEmployeeById(db, id);
  if (!employee) return null;
  const currentSalary = await salaryRecordRepo.getCurrentSalary(db, id);
  return { ...employee, currentSalary };
}

export interface ListEmployeesFilter {
  department?: string;
  country?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface ListEmployeesResult {
  items: Employee[];
  total: number;
  page: number;
  pageSize: number;
}

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

export async function listEmployees(
  filter: ListEmployeesFilter = {},
  db: PrismaClient = prisma,
): Promise<ListEmployeesResult> {
  const page = filter.page && filter.page > 0 ? filter.page : 1;
  const pageSize = Math.min(
    filter.pageSize && filter.pageSize > 0 ? filter.pageSize : DEFAULT_PAGE_SIZE,
    MAX_PAGE_SIZE,
  );

  const { items, total } = await employeeRepo.listEmployees(db, {
    skip: (page - 1) * pageSize,
    take: pageSize,
    department: filter.department,
    country: filter.country,
    search: filter.search,
  });

  return { items, total, page, pageSize };
}

export async function getSalaryHistory(employeeId: string, db: PrismaClient = prisma): Promise<SalaryRecord[]> {
  return salaryRecordRepo.getSalaryHistory(db, employeeId);
}
