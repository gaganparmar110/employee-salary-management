import type { Response } from "express";

export interface ApiSuccessResponse<T> {
  success: true;
  statusCode: number;
  message: string;
  data: T;
}

export interface SendSuccessOptions {
  status?: number;
  message?: string;
}

// The one place every route builds a success response, so the envelope
// shape can't drift between routes. Error responses go through the
// matching shape in middleware/error.middleware.ts.
export function sendSuccess<T>(res: Response, data: T, options: SendSuccessOptions = {}): void {
  const status = options.status ?? 200;
  const body: ApiSuccessResponse<T> = {
    success: true,
    statusCode: status,
    message: options.message ?? "Success",
    data,
  };
  res.status(status).json(body);
}
