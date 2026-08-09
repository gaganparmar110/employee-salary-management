import type { Db } from "../lib/prisma.js";

// Repository-only shape — includes passwordHash, unlike the domain
// HrManager type. Only auth.service.ts reads this.
export interface HrManagerRecord {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
}

export async function findHrManagerByEmail(db: Db, email: string): Promise<HrManagerRecord | null> {
  return db.hrManager.findUnique({ where: { email } });
}

export interface CreateHrManagerData {
  email: string;
  passwordHash: string;
}

export async function createHrManager(db: Db, data: CreateHrManagerData): Promise<HrManagerRecord> {
  return db.hrManager.create({ data });
}
