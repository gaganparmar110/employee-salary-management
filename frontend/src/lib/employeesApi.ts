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
