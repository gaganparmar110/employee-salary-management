import { beforeEach, describe, expect, it } from "vitest";
import type { PrismaClient } from "@prisma/client";
import { createFakePrismaClient } from "./helpers/fakePrismaClient.js";
import {
  createEmployee,
  getEmployee,
  getSalaryHistory,
  listEmployees,
  updateSalary,
} from "../services/employee.service.js";
import { DomainError, NotFoundError } from "../services/errors.js";
import type { CreateEmployeeInput } from "../services/employee.schemas.js";

describe("employee service", () => {
  let db: PrismaClient;
  const managerId = "manager-1";

  beforeEach(() => {
    db = createFakePrismaClient();
  });

  const baseInput: CreateEmployeeInput = {
    employeeCode: "E001",
    fullName: "Ada Lovelace",
    department: "Engineering",
    country: "UK",
    currency: "GBP",
    initialSalary: { amount: 90000, payFrequency: "ANNUAL", effectiveDate: new Date("2024-01-01") },
  };

  it("creates an employee with exactly one HIRE salary record", async () => {
    const { employee } = await createEmployee(baseInput, managerId, db);

    const history = await getSalaryHistory(employee.id, db);
    expect(history).toHaveLength(1);
    expect(history[0].reason).toBe("HIRE");
    expect(history[0].amount).toBe("90000");
  });

  it("appends salary updates instead of overwriting history", async () => {
    const { employee } = await createEmployee(baseInput, managerId, db);

    await updateSalary(
      employee.id,
      { amount: 95000, currency: "GBP", payFrequency: "ANNUAL", effectiveDate: new Date("2024-06-01"), reason: "RAISE" },
      managerId,
      db,
    );
    await updateSalary(
      employee.id,
      { amount: 100000, currency: "GBP", payFrequency: "ANNUAL", effectiveDate: new Date("2025-01-01"), reason: "RAISE" },
      managerId,
      db,
    );

    const history = await getSalaryHistory(employee.id, db);
    expect(history).toHaveLength(3);
    expect(history.map((r) => r.amount).sort()).toEqual(["100000", "90000", "95000"]);
    expect(history.find((r) => r.reason === "HIRE")?.amount).toBe("90000");
  });

  it("rejects a currency change without reason CURRENCY_CHANGE", async () => {
    const { employee } = await createEmployee(baseInput, managerId, db);

    await expect(
      updateSalary(
        employee.id,
        { amount: 95000, currency: "USD", payFrequency: "ANNUAL", effectiveDate: new Date(), reason: "RAISE" },
        managerId,
        db,
      ),
    ).rejects.toThrow(DomainError);
  });

  it("rejects reason CURRENCY_CHANGE when the currency is unchanged", async () => {
    const { employee } = await createEmployee(baseInput, managerId, db);

    await expect(
      updateSalary(
        employee.id,
        { amount: 95000, currency: "GBP", payFrequency: "ANNUAL", effectiveDate: new Date(), reason: "CURRENCY_CHANGE" },
        managerId,
        db,
      ),
    ).rejects.toThrow(DomainError);
  });

  it("accepts a real currency change and keeps the employee's currency in sync", async () => {
    const { employee } = await createEmployee(baseInput, managerId, db);

    await updateSalary(
      employee.id,
      { amount: 95000, currency: "USD", payFrequency: "ANNUAL", effectiveDate: new Date(), reason: "CURRENCY_CHANGE" },
      managerId,
      db,
    );

    const updated = await getEmployee(employee.id, db);
    expect(updated?.currency).toBe("USD");
    expect(updated?.currentSalary?.currency).toBe("USD");
  });

  it("throws NotFoundError for an unknown employee", async () => {
    await expect(
      updateSalary(
        "missing-id",
        { amount: 1000, currency: "GBP", payFrequency: "ANNUAL", effectiveDate: new Date(), reason: "RAISE" },
        managerId,
        db,
      ),
    ).rejects.toThrow(NotFoundError);
  });

  it("rejects invalid input before touching the database", async () => {
    await expect(
      createEmployee(
        { ...baseInput, initialSalary: { ...baseInput.initialSalary, amount: -100 } },
        managerId,
        db,
      ),
    ).rejects.toThrow();

    const { total } = await listEmployees({}, db);
    expect(total).toBe(0);
  });
});
