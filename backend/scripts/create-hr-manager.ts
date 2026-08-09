// Creates the one trusted HR Manager account (see docs/REQUIREMENTS.pdf —
// no self-service, no public registration). Run once per environment:
//   npm run create-hr-manager --workspace=backend -- <email> <password>
import "dotenv/config";
import { createHrManager } from "../src/services/auth.service.js";
import { prisma } from "../src/lib/prisma.js";

async function main() {
  const [email, password] = process.argv.slice(2);

  if (!email || !password) {
    console.error("Usage: npm run create-hr-manager --workspace=backend -- <email> <password>");
    process.exitCode = 1;
    return;
  }

  const hrManager = await createHrManager(email, password);
  console.log(`Created HR Manager ${hrManager.email} (${hrManager.id})`);
}

main().finally(() => prisma.$disconnect());
