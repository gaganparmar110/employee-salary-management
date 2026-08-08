import type { NextFunction, Request, Response } from "express";
import { verifyHrManagerToken } from "../lib/jwt.js";

export interface AuthenticatedRequest extends Request {
  hrManager?: { id: string; email: string };
}

// The single centralized auth check every protected route goes through —
// adding a role later (e.g. EMPLOYEE for self-service) means a new check
// here, not touching every route handler.
export function requireHrManager(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : undefined;

  if (!token) {
    res.status(401).json({ error: "Missing Authorization header" });
    return;
  }

  try {
    const payload = verifyHrManagerToken(token);
    req.hrManager = { id: payload.sub, email: payload.email };
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}
