import { Router } from "express";
import { sendSuccess } from "../lib/apiResponse.js";
import { login } from "../services/auth.service.js";

export const authRouter = Router();

authRouter.post("/login", async (req, res, next) => {
  try {
    const result = await login(req.body);
    sendSuccess(res, result, { message: "Login successful" });
  } catch (err) {
    next(err);
  }
});
