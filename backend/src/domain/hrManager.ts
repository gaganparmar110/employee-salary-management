// Never includes passwordHash — that stays inside the repository layer and
// auth service, and never crosses into a domain object handed back to a
// route or test that isn't specifically dealing with credentials.
export interface HrManager {
  id: string;
  email: string;
  createdAt: Date;
}
