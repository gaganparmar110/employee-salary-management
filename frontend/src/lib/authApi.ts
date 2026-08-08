import { apiRequest } from "./apiClient";
import type { HrManagerSummary } from "../store/authStore";

export interface LoginResult {
  token: string;
  hrManager: HrManagerSummary;
}

export function login(email: string, password: string): Promise<LoginResult> {
  return apiRequest<LoginResult>("/api/v1/auth/login", {
    method: "POST",
    body: { email, password },
  });
}
