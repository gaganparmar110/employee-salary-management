import type { PrismaClient } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import * as hrManagerRepo from "../repositories/hrManager.repository.js";
import { hashPassword, verifyPassword } from "../lib/password.js";
import { signHrManagerToken } from "../lib/jwt.js";
import { loginSchema, type LoginInput } from "./auth.schemas.js";
import { DomainError } from "./errors.js";
import type { HrManager } from "../domain/index.js";

export interface LoginResult {
  token: string;
  hrManager: HrManager;
}

export async function login(input: LoginInput, db: PrismaClient = prisma): Promise<LoginResult> {
  const parsed = loginSchema.parse(input);

  const record = await hrManagerRepo.findHrManagerByEmail(db, parsed.email);
  // Same message either way — don't reveal whether the email exists.
  if (!record || !(await verifyPassword(parsed.password, record.passwordHash))) {
    throw new DomainError("Invalid email or password");
  }

  const token = signHrManagerToken({ sub: record.id, email: record.email });

  return {
    token,
    hrManager: { id: record.id, email: record.email, createdAt: record.createdAt },
  };
}

// Bootstrapping only — there's deliberately no public registration
// endpoint (single trusted HR Manager account, per requirements). Used by
// scripts/create-hr-manager.ts for local/initial setup.
export async function createHrManager(
  email: string,
  password: string,
  db: PrismaClient = prisma,
): Promise<HrManager> {
  const passwordHash = await hashPassword(password);
  const record = await hrManagerRepo.createHrManager(db, { email, passwordHash });
  return { id: record.id, email: record.email, createdAt: record.createdAt };
}
