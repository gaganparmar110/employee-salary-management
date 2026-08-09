import { apiRequest } from "./apiClient";

// Mirrors backend/src/services/employee.service.ts's return shapes — see
// lib/reportsApi.ts for why this duplication across the two deployables
// is deliberate.

export interface Employee {
  id: string;
  employeeCode: string;
  fullName: string;
  department: string;
  country: string;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

export interface ListEmployeesResult {
  items: Employee[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ListEmployeesFilter {
  search?: string;
  department?: string;
  country?: string;
  page?: number;
  pageSize?: number;
}

export function listEmployees(token: string, filter: ListEmployeesFilter = {}): Promise<ListEmployeesResult> {
  return apiRequest("/api/v1/employees", {
    token,
    params: {
      search: filter.search,
      department: filter.department,
      country: filter.country,
      page: filter.page,
      pageSize: filter.pageSize,
    },
  });
}

export type PayFrequency = "ANNUAL" | "MONTHLY";
export type SalaryChangeReason = "HIRE" | "RAISE" | "ADJUSTMENT" | "CURRENCY_CHANGE" | "CORRECTION";

export interface SalaryRecord {
  id: string;
  employeeId: string;
  amount: string;
  currency: string;
  payFrequency: PayFrequency;
  effectiveDate: string;
  reason: SalaryChangeReason;
  changedById: string;
  createdAt: string;
}

export interface EmployeeWithCurrentSalary extends Employee {
  currentSalary: SalaryRecord | null;
}

export function getEmployee(token: string, id: string): Promise<EmployeeWithCurrentSalary> {
  return apiRequest(`/api/v1/employees/${id}`, { token });
}

export function getSalaryHistory(token: string, id: string): Promise<SalaryRecord[]> {
  return apiRequest(`/api/v1/employees/${id}/salary-history`, { token });
}

export interface UpdateSalaryInput {
  amount: number;
  currency: string;
  payFrequency: PayFrequency;
  effectiveDate: string;
  reason: Exclude<SalaryChangeReason, "HIRE">;
}

export interface UpdateSalaryResult {
  current: SalaryRecord;
  previous: SalaryRecord | null;
}

export function updateSalary(token: string, id: string, input: UpdateSalaryInput): Promise<UpdateSalaryResult> {
  return apiRequest(`/api/v1/employees/${id}/salary`, { token, method: "POST", body: input });
}
