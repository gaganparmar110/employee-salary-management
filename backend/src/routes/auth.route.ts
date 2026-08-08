import { Router } from "express";
import { ZodError } from "zod";
import { login } from "../services/auth.service.js";
import { DomainError } from "../services/errors.js";

export const authRouter = Router();

authRouter.post("/login", async (req, res) => {
  try {
    const result = await login(req.body);
    res.json(result);
  } catch (err) {
    if (err instanceof ZodError) {
      res.status(400).json({ error: "Invalid input", details: err.issues });
      return;
    }
    if (err instanceof DomainError) {
      res.status(401).json({ error: err.message });
      return;
    }
    throw err;
  }
});
