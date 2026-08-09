import { apiRequest } from "./apiClient";

// Mirrors backend/src/services/reporting.ts's types — two separate
// deployables (see docs/ARCHITECTURE.md), so this is a deliberate small
// duplication rather than a shared package.

export interface GroupSalarySummary {
  group: string;
  currency: string;
  headcount: number;
  totalCost: number;
  averageSalary: number;
  medianSalary: number;
}

export interface DepartmentCountrySalarySummary {
  department: string;
  country: string;
  currency: string;
  headcount: number;
  totalCost: number;
  averageSalary: number;
  medianSalary: number;
}

export interface OverallSalarySummary {
  currency: string;
  headcount: number;
  totalCost: number;
  averageSalary: number;
  medianSalary: number;
}

export interface SalaryBand {
  currency: string;
  min: number;
  max: number;
  count: number;
}

export interface EarnerEntry {
  employeeCode: string;
  fullName: string;
  department: string;
  country: string;
  amount: number;
}

export interface CurrencyEarnersReport {
  currency: string;
  top: EarnerEntry[];
  bottom: EarnerEntry[];
}

export interface PayOverTimePeriod {
  period: string;
  summary: OverallSalarySummary[];
}

export function getOverview(token: string): Promise<OverallSalarySummary[]> {
  return apiRequest("/api/v1/reports/overview", { token });
}

export function getByDepartment(token: string): Promise<GroupSalarySummary[]> {
  return apiRequest("/api/v1/reports/by-department", { token });
}

export function getByCountry(token: string): Promise<GroupSalarySummary[]> {
  return apiRequest("/api/v1/reports/by-country", { token });
}

export function getByDepartmentCountry(
  token: string,
  params: { department?: string; country?: string } = {},
): Promise<DepartmentCountrySalarySummary[]> {
  return apiRequest("/api/v1/reports/by-department-country", { token, params });
}

export function getSalaryDistribution(token: string, bands?: number): Promise<SalaryBand[]> {
  return apiRequest("/api/v1/reports/salary-distribution", { token, params: { bands } });
}

export function getTopEarners(
  token: string,
  params: { currency?: string; limit?: number } = {},
): Promise<CurrencyEarnersReport[]> {
  return apiRequest("/api/v1/reports/top-earners", { token, params });
}

export function getPayOverTime(
  token: string,
  params: { department?: string; country?: string } = {},
): Promise<PayOverTimePeriod[]> {
  return apiRequest("/api/v1/reports/pay-over-time", { token, params });
}
