import { PrismaClient, type Prisma } from "@prisma/client";

// What repository functions accept as their `db` param: either the real
// client or a `$transaction` callback's tx — both expose the same model
// delegates (employee, salaryRecord, ...), just not $transaction itself.
export type Db = Prisma.TransactionClient;

// Reuse a single client across hot reloads in dev instead of exhausting
// Postgres connections with a new client per reload.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
