import { describe, expect, it, vi } from "vitest";
import type { Response } from "express";
import { requireHrManager, type AuthenticatedRequest } from "../middleware/auth.middleware.js";
import { signHrManagerToken } from "../lib/jwt.js";

function fakeRes(): Response {
  const res = {} as Response;
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

describe("requireHrManager middleware", () => {
  it("attaches the HR manager identity and calls next() for a valid token", () => {
    const token = signHrManagerToken({ sub: "manager-1", email: "hr@acme.test" });
    const req = { headers: { authorization: `Bearer ${token}` } } as AuthenticatedRequest;
    const res = fakeRes();
    const next = vi.fn();

    requireHrManager(req, res, next);

    expect(req.hrManager).toEqual({ id: "manager-1", email: "hr@acme.test" });
    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("returns 401 when the Authorization header is missing", () => {
    const req = { headers: {} } as AuthenticatedRequest;
    const res = fakeRes();
    const next = vi.fn();

    requireHrManager(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 401 for an invalid token", () => {
    const req = { headers: { authorization: "Bearer not-a-real-token" } } as AuthenticatedRequest;
    const res = fakeRes();
    const next = vi.fn();

    requireHrManager(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
});
