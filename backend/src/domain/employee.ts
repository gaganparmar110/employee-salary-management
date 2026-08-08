import type { SalaryRecord } from "./salaryRecord.js";

export interface Employee {
  id: string;
  employeeCode: string;
  fullName: string;
  department: string;
  country: string;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmployeeWithCurrentSalary extends Employee {
  currentSalary: SalaryRecord | null;
}
