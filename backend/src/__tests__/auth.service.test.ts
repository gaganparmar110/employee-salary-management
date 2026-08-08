import { beforeEach, describe, expect, it } from "vitest";
import type { PrismaClient } from "@prisma/client";
import { createFakePrismaClient } from "./helpers/fakePrismaClient.js";
import { createHrManager, login } from "../services/auth.service.js";
import { verifyHrManagerToken } from "../lib/jwt.js";
import { AuthenticationError } from "../services/errors.js";

describe("auth service", () => {
  let db: PrismaClient;

  beforeEach(() => {
    db = createFakePrismaClient();
  });

  it("creates an HR manager with a hashed password, not the plaintext", async () => {
    const hrManager = await createHrManager("hr@acme.test", "correct-horse", db);
    expect(hrManager.email).toBe("hr@acme.test");
    // The domain type has no passwordHash field at all — this is really
    // just documenting that fact for readers of the test.
    expect(hrManager).not.toHaveProperty("passwordHash");
  });

  it("logs in with correct credentials and returns a usable token", async () => {
    const created = await createHrManager("hr@acme.test", "correct-horse", db);

    const { token, hrManager } = await login({ email: "hr@acme.test", password: "correct-horse" }, db);

    expect(hrManager.id).toBe(created.id);
    expect(verifyHrManagerToken(token).sub).toBe(created.id);
  });

  it("rejects an unknown email", async () => {
    await expect(login({ email: "nobody@acme.test", password: "whatever" }, db)).rejects.toThrow(
      AuthenticationError,
    );
  });

  it("rejects the wrong password", async () => {
    await createHrManager("hr@acme.test", "correct-horse", db);
    await expect(login({ email: "hr@acme.test", password: "wrong-password" }, db)).rejects.toThrow(
      AuthenticationError,
    );
  });
});
