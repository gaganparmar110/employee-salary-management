import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { AuthenticationError, DomainError, NotFoundError } from "../services/errors.js";

// The one place service errors turn into HTTP responses — routes just
// call next(err) and never touch status codes themselves.
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof ZodError) {
    res.status(400).json({ error: "Invalid input", details: err.issues });
    return;
  }
  if (err instanceof AuthenticationError) {
    res.status(401).json({ error: err.message });
    return;
  }
  if (err instanceof NotFoundError) {
    res.status(404).json({ error: err.message });
    return;
  }
  if (err instanceof DomainError) {
    res.status(400).json({ error: err.message });
    return;
  }

  console.error(err);
  res.status(500).json({ error: "Internal server error" });
}
