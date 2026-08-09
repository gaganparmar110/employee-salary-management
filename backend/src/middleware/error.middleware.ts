import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { AuthenticationError, DomainError, NotFoundError } from "../services/errors.js";

function sendError(res: Response, status: number, message: string, details?: unknown): void {
  res.status(status).json({ success: false, statusCode: status, message, ...(details ? { details } : {}) });
}

// The one place service errors turn into HTTP responses — routes just
// call next(err) and never touch status codes themselves. Mirrors
// sendSuccess's { success, statusCode, message, ... } envelope so the
// frontend can branch on `success` without also having to check the HTTP
// status.
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof ZodError) {
    sendError(res, 400, "Invalid input", err.issues);
    return;
  }
  if (err instanceof AuthenticationError) {
    sendError(res, 401, err.message);
    return;
  }
  if (err instanceof NotFoundError) {
    sendError(res, 404, err.message);
    return;
  }
  if (err instanceof DomainError) {
    sendError(res, 400, err.message);
    return;
  }

  console.error(err);
  sendError(res, 500, "Internal server error");
}
