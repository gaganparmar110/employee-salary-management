import { describe, expect, it } from "vitest";
import { signHrManagerToken, verifyHrManagerToken } from "../lib/jwt.js";

describe("jwt", () => {
  it("round-trips a payload through sign and verify", () => {
    const token = signHrManagerToken({ sub: "manager-1", email: "hr@acme.test" });
    const payload = verifyHrManagerToken(token);
    expect(payload.sub).toBe("manager-1");
    expect(payload.email).toBe("hr@acme.test");
  });

  it("rejects a tampered token", () => {
    const token = signHrManagerToken({ sub: "manager-1", email: "hr@acme.test" });
    expect(() => verifyHrManagerToken(`${token}tampered`)).toThrow();
  });
});
