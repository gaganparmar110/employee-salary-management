// Deterministic seed for 10,000 employees (see docs/REQUIREMENTS.pdf, item
// 7). Goes through the same EmployeeService functions manual CRUD and bulk
// import will use — the "one write path" rule applies here too, so this
// script can't drift from the validation/history-writing logic they use.
//
// Re-runnable: clears existing employee/salary data (never hr_managers, so
// real login accounts survive) and reseeds from scratch every time, so the
// result is the same regardless of how many times you run it.
//
// Usage: npm run seed --workspace=backend
//        SEED_COUNT=100 npm run seed --workspace=backend   (smaller run)
import "dotenv/config";
import { prisma } from "../src/lib/prisma.js";
import { createHrManager } from "../src/services/auth.service.js";
import { findHrManagerByEmail } from "../src/repositories/hrManager.repository.js";
import { createEmployee, updateSalary } from "../src/services/employee.service.js";
import { generateSeedPlans, type SeedEmployeePlan } from "./seedPlan.js";

const EMPLOYEE_COUNT = Number(process.env.SEED_COUNT ?? 10000);
const SEED = 42;
// Overridable for higher-latency connections (e.g. seeding a remote DB) —
// 20 concurrent transactions is fine over localhost but starves Prisma's
// default 2s transaction-acquire timeout over a real network round trip.
const BATCH_SIZE = Number(process.env.SEED_BATCH_SIZE ?? 20);
const SEED_HR_MANAGER_EMAIL = "seed-admin@acme.test";
const SEED_HR_MANAGER_PASSWORD = "seed-admin-password"; // dev-only bootstrap account

async function ensureSeedHrManager(): Promise<string> {
  const existing = await findHrManagerByEmail(prisma, SEED_HR_MANAGER_EMAIL);
  if (existing) return existing.id;

  const created = await createHrManager(SEED_HR_MANAGER_EMAIL, SEED_HR_MANAGER_PASSWORD);
  console.log(`Created seed HR Manager ${created.email} (dev-only password: "${SEED_HR_MANAGER_PASSWORD}")`);
  return created.id;
}

async function resetEmployeeData(): Promise<void> {
  // salary_records first — it has the FK to employees.
  await prisma.salaryRecord.deleteMany();
  await prisma.employee.deleteMany();
}

async function seedEmployee(plan: SeedEmployeePlan, actingManagerId: string): Promise<void> {
  const { employee } = await createEmployee(
    {
      employeeCode: plan.employeeCode,
      fullName: plan.fullName,
      department: plan.department,
      country: plan.country,
      currency: plan.currency,
      initialSalary: {
        amount: plan.hireAmount,
        payFrequency: plan.payFrequency,
        effectiveDate: plan.hireDate,
      },
    },
    actingManagerId,
  );

  for (const event of plan.history) {
    await updateSalary(
      employee.id,
      {
        amount: event.amount,
        currency: event.currency,
        payFrequency: event.payFrequency,
        effectiveDate: event.effectiveDate,
        reason: event.reason,
      },
      actingManagerId,
    );
  }
}

async function main() {
  console.log(`Seeding ${EMPLOYEE_COUNT} employees (deterministic seed=${SEED})...`);

  const actingManagerId = await ensureSeedHrManager();
  await resetEmployeeData();

  const plans = generateSeedPlans(EMPLOYEE_COUNT, new Date(), SEED);

  let done = 0;
  for (let i = 0; i < plans.length; i += BATCH_SIZE) {
    const batch = plans.slice(i, i + BATCH_SIZE);
    await Promise.all(batch.map((plan) => seedEmployee(plan, actingManagerId)));
    done += batch.length;
    if (done % 1000 === 0 || done === plans.length) {
      console.log(`  ${done}/${plans.length} employees seeded`);
    }
  }

  console.log("Done.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
