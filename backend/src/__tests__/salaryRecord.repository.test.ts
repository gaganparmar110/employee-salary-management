import { beforeEach, describe, expect, it } from "vitest";
import type { PrismaClient } from "@prisma/client";
import { createFakePrismaClient } from "./helpers/fakePrismaClient.js";
import * as employeeRepo from "../repositories/employee.repository.js";
import * as salaryRecordRepo from "../repositories/salaryRecord.repository.js";

describe("salaryRecord repository", () => {
  let db: PrismaClient;
  let employeeId: string;

  beforeEach(async () => {
    db = createFakePrismaClient();
    const employee = await employeeRepo.createEmployee(db, {
      employeeCode: "E001",
      fullName: "Ada Lovelace",
      department: "Engineering",
      country: "UK",
      currency: "GBP",
    });
    employeeId = employee.id;
  });

  it("appends salary records without overwriting prior ones", async () => {
    await salaryRecordRepo.insertSalaryRecord(db, {
      employeeId,
      amount: "90000",
      currency: "GBP",
      payFrequency: "ANNUAL",
      effectiveDate: new Date("2024-01-01"),
      reason: "HIRE",
      changedById: "manager-1",
    });
    await salaryRecordRepo.insertSalaryRecord(db, {
      employeeId,
      amount: "95000",
      currency: "GBP",
      payFrequency: "ANNUAL",
      effectiveDate: new Date("2024-06-01"),
      reason: "RAISE",
      changedById: "manager-1",
    });

    const history = await salaryRecordRepo.getSalaryHistory(db, employeeId);
    expect(history).toHaveLength(2);
    expect(history[0].amount).toBe("95000"); // newest first
    expect(history[1].amount).toBe("90000");
  });

  it("returns the most recent record as the current salary", async () => {
    await salaryRecordRepo.insertSalaryRecord(db, {
      employeeId,
      amount: "90000",
      currency: "GBP",
      payFrequency: "ANNUAL",
      effectiveDate: new Date("2024-01-01"),
      reason: "HIRE",
      changedById: "manager-1",
    });
    await salaryRecordRepo.insertSalaryRecord(db, {
      employeeId,
      amount: "95000",
      currency: "GBP",
      payFrequency: "ANNUAL",
      effectiveDate: new Date("2024-06-01"),
      reason: "RAISE",
      changedById: "manager-1",
    });

    const current = await salaryRecordRepo.getCurrentSalary(db, employeeId);
    expect(current?.amount).toBe("95000");
  });

  it("returns null current salary when none exist", async () => {
    expect(await salaryRecordRepo.getCurrentSalary(db, employeeId)).toBeNull();
  });
});
