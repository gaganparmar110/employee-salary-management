import { Router } from "express";
import { login } from "../services/auth.service.js";

export const authRouter = Router();

authRouter.post("/login", async (req, res, next) => {
  try {
    const result = await login(req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
});
