import { randomUUID } from "node:crypto";
import type { PrismaClient } from "@prisma/client";

// A minimal in-memory stand-in for PrismaClient, covering only the calls
// the repository layer actually makes (employee/salaryRecord CRUD +
// $transaction). Not a general Prisma mock — cast to PrismaClient once
// here so call sites (repositories, services) need no casts of their own.

interface EmployeeRow {
  id: string;
  employeeCode: string;
  fullName: string;
  department: string;
  country: string;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
}

interface SalaryRecordRow {
  id: string;
  employeeId: string;
  amount: string;
  currency: string;
  payFrequency: string;
  effectiveDate: Date;
  reason: string;
  changedById: string;
  createdAt: Date;
}

interface EmployeeWhere {
  department?: string;
  country?: string;
  OR?: Array<{
    fullName?: { contains: string; mode: "insensitive" };
    employeeCode?: { contains: string; mode: "insensitive" };
  }>;
}

function matchesEmployeeWhere(row: EmployeeRow, where: EmployeeWhere = {}): boolean {
  if (where.department && row.department !== where.department) return false;
  if (where.country && row.country !== where.country) return false;
  if (where.OR) {
    const matchesAny = where.OR.some((cond) => {
      if (cond.fullName) return row.fullName.toLowerCase().includes(cond.fullName.contains.toLowerCase());
      if (cond.employeeCode) return row.employeeCode.toLowerCase().includes(cond.employeeCode.contains.toLowerCase());
      return false;
    });
    if (!matchesAny) return false;
  }
  return true;
}

function sortSalaryRecords(rows: SalaryRecordRow[]): SalaryRecordRow[] {
  return [...rows].sort((a, b) => {
    const byEffectiveDate = b.effectiveDate.getTime() - a.effectiveDate.getTime();
    return byEffectiveDate !== 0 ? byEffectiveDate : b.createdAt.getTime() - a.createdAt.getTime();
  });
}

interface FakeDb {
  employee: {
    create(args: { data: Omit<EmployeeRow, "id" | "createdAt" | "updatedAt"> }): Promise<EmployeeRow>;
    findUnique(args: { where: { id: string } }): Promise<EmployeeRow | null>;
    findMany(args: { where?: EmployeeWhere; skip?: number; take?: number }): Promise<EmployeeRow[]>;
    count(args: { where?: EmployeeWhere }): Promise<number>;
    update(args: { where: { id: string }; data: Partial<EmployeeRow> }): Promise<EmployeeRow>;
  };
  salaryRecord: {
    create(args: { data: Omit<SalaryRecordRow, "id" | "createdAt"> }): Promise<SalaryRecordRow>;
    findMany(args: { where: { employeeId: string }; skip?: number; take?: number }): Promise<SalaryRecordRow[]>;
    findFirst(args: { where: { employeeId: string } }): Promise<SalaryRecordRow | null>;
  };
  $transaction<T>(callback: (tx: FakeDb) => Promise<T>): Promise<T>;
}

export function createFakePrismaClient(): PrismaClient {
  const employees: EmployeeRow[] = [];
  const salaryRecords: SalaryRecordRow[] = [];

  const client: FakeDb = {
    employee: {
      async create({ data }: { data: Omit<EmployeeRow, "id" | "createdAt" | "updatedAt"> }) {
        if (employees.some((e) => e.employeeCode === data.employeeCode)) {
          throw new Error(`Unique constraint failed on employeeCode: ${data.employeeCode}`);
        }
        const now = new Date();
        const row: EmployeeRow = { ...data, id: randomUUID(), createdAt: now, updatedAt: now };
        employees.push(row);
        return row;
      },
      async findUnique({ where }: { where: { id: string } }) {
        return employees.find((e) => e.id === where.id) ?? null;
      },
      async findMany({ where, skip = 0, take }: { where?: EmployeeWhere; skip?: number; take?: number }) {
        const matched = employees.filter((e) => matchesEmployeeWhere(e, where));
        return take !== undefined ? matched.slice(skip, skip + take) : matched.slice(skip);
      },
      async count({ where }: { where?: EmployeeWhere }) {
        return employees.filter((e) => matchesEmployeeWhere(e, where)).length;
      },
      async update({ where, data }: { where: { id: string }; data: Partial<EmployeeRow> }) {
        const row = employees.find((e) => e.id === where.id);
        if (!row) throw new Error(`Employee ${where.id} not found`);
        Object.assign(row, data, { updatedAt: new Date() });
        return row;
      },
    },
    salaryRecord: {
      async create({ data }: { data: Omit<SalaryRecordRow, "id" | "createdAt"> }) {
        const row: SalaryRecordRow = { ...data, id: randomUUID(), createdAt: new Date() };
        salaryRecords.push(row);
        return row;
      },
      async findMany({
        where,
        skip = 0,
        take,
      }: {
        where: { employeeId: string };
        skip?: number;
        take?: number;
      }) {
        const matched = sortSalaryRecords(salaryRecords.filter((r) => r.employeeId === where.employeeId));
        return take !== undefined ? matched.slice(skip, skip + take) : matched.slice(skip);
      },
      async findFirst({ where }: { where: { employeeId: string } }) {
        const matched = sortSalaryRecords(salaryRecords.filter((r) => r.employeeId === where.employeeId));
        return matched[0] ?? null;
      },
    },
    async $transaction<T>(callback: (tx: FakeDb) => Promise<T>): Promise<T> {
      return callback(client);
    },
  };

  return client as unknown as PrismaClient;
}
