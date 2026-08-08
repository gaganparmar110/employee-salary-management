import { Router } from "express";
import { sendSuccess } from "../lib/apiResponse.js";

export const healthRouter = Router();

healthRouter.get("/", (_req, res) => {
  sendSuccess(res, { status: "ok" }, { message: "Service is healthy" });
});
