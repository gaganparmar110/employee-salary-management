import { beforeEach, describe, expect, it } from "vitest";
import type { PrismaClient } from "@prisma/client";
import { createFakePrismaClient } from "./helpers/fakePrismaClient.js";
import * as employeeRepo from "../repositories/employee.repository.js";

describe("employee repository", () => {
  let db: PrismaClient;

  beforeEach(() => {
    db = createFakePrismaClient();
  });

  const baseEmployee = {
    employeeCode: "E001",
    fullName: "Ada Lovelace",
    department: "Engineering",
    country: "UK",
    currency: "GBP",
  };

  it("creates and finds an employee by id", async () => {
    const created = await employeeRepo.createEmployee(db, baseEmployee);
    const found = await employeeRepo.findEmployeeById(db, created.id);
    expect(found).toEqual(created);
  });

  it("rejects a duplicate employeeCode", async () => {
    await employeeRepo.createEmployee(db, baseEmployee);
    await expect(employeeRepo.createEmployee(db, baseEmployee)).rejects.toThrow();
  });

  it("returns null for a missing id", async () => {
    expect(await employeeRepo.findEmployeeById(db, "missing-id")).toBeNull();
  });

  it("filters by department/country and paginates", async () => {
    await employeeRepo.createEmployee(db, { ...baseEmployee, employeeCode: "E001", country: "UK" });
    await employeeRepo.createEmployee(db, {
      ...baseEmployee,
      employeeCode: "E002",
      fullName: "Grace Hopper",
      country: "US",
    });
    await employeeRepo.createEmployee(db, {
      ...baseEmployee,
      employeeCode: "E003",
      fullName: "Alan Turing",
      department: "Sales",
      country: "UK",
    });

    const engineering = await employeeRepo.listEmployees(db, { skip: 0, take: 10, department: "Engineering" });
    expect(engineering.total).toBe(2);
    expect(engineering.items.map((e) => e.employeeCode).sort()).toEqual(["E001", "E002"]);

    const page1 = await employeeRepo.listEmployees(db, { skip: 0, take: 1 });
    expect(page1.items).toHaveLength(1);
    expect(page1.total).toBe(3);
  });

  it("searches by name or employee code (case-insensitive)", async () => {
    await employeeRepo.createEmployee(db, { ...baseEmployee, employeeCode: "E001", fullName: "Ada Lovelace" });
    await employeeRepo.createEmployee(db, { ...baseEmployee, employeeCode: "E002", fullName: "Grace Hopper" });

    const byName = await employeeRepo.listEmployees(db, { skip: 0, take: 10, search: "lovelace" });
    expect(byName.items.map((e) => e.employeeCode)).toEqual(["E001"]);

    const byCode = await employeeRepo.listEmployees(db, { skip: 0, take: 10, search: "e002" });
    expect(byCode.items.map((e) => e.employeeCode)).toEqual(["E002"]);
  });
});
