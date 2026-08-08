import type { Prisma } from "@prisma/client";
import type { Db } from "../lib/prisma.js";
import type { Employee } from "../domain/index.js";

function toDomainEmployee(row: {
  id: string;
  employeeCode: string;
  fullName: string;
  department: string;
  country: string;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
}): Employee {
  return { ...row };
}

export interface CreateEmployeeData {
  employeeCode: string;
  fullName: string;
  department: string;
  country: string;
  currency: string;
}

export async function createEmployee(db: Db, data: CreateEmployeeData): Promise<Employee> {
  const row = await db.employee.create({ data });
  return toDomainEmployee(row);
}

export async function findEmployeeById(db: Db, id: string): Promise<Employee | null> {
  const row = await db.employee.findUnique({ where: { id } });
  return row ? toDomainEmployee(row) : null;
}

export interface ListEmployeesParams {
  skip: number;
  take: number;
  department?: string;
  country?: string;
  search?: string;
}

export interface ListEmployeesResult {
  items: Employee[];
  total: number;
}

export async function listEmployees(db: Db, params: ListEmployeesParams): Promise<ListEmployeesResult> {
  const where: Prisma.EmployeeWhereInput = {
    ...(params.department ? { department: params.department } : {}),
    ...(params.country ? { country: params.country } : {}),
    ...(params.search
      ? {
          OR: [
            { fullName: { contains: params.search, mode: "insensitive" } },
            { employeeCode: { contains: params.search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [rows, total] = await Promise.all([
    db.employee.findMany({ where, skip: params.skip, take: params.take, orderBy: { createdAt: "desc" } }),
    db.employee.count({ where }),
  ]);

  return { items: rows.map(toDomainEmployee), total };
}

// Only called from the salary-update service path when reason is
// CURRENCY_CHANGE — Employee.currency is a denormalized copy of "current
// currency" and must stay in sync with the latest SalaryRecord.
export async function updateEmployeeCurrency(db: Db, id: string, currency: string): Promise<Employee> {
  const row = await db.employee.update({ where: { id }, data: { currency } });
  return toDomainEmployee(row);
}
