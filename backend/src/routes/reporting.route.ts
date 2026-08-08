import { Router } from "express";
import { requireHrManager } from "../middleware/auth.middleware.js";
import * as reportingService from "../services/reporting.service.js";

export const reportingRouter = Router();

reportingRouter.use(requireHrManager);

reportingRouter.get("/by-department", async (_req, res, next) => {
  try {
    res.json(await reportingService.getDepartmentReport());
  } catch (err) {
    next(err);
  }
});

reportingRouter.get("/by-country", async (_req, res, next) => {
  try {
    res.json(await reportingService.getCountryReport());
  } catch (err) {
    next(err);
  }
});

reportingRouter.get("/overview", async (_req, res, next) => {
  try {
    res.json(await reportingService.getOverview());
  } catch (err) {
    next(err);
  }
});

reportingRouter.get("/top-earners", async (req, res, next) => {
  try {
    const { currency, limit } = req.query;
    const result = await reportingService.getTopEarners({
      currency: typeof currency === "string" ? currency : undefined,
      limit: limit ? Number(limit) : undefined,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

reportingRouter.get("/pay-over-time", async (req, res, next) => {
  try {
    const { department, country } = req.query;
    const result = await reportingService.getPayOverTime({
      department: typeof department === "string" ? department : undefined,
      country: typeof country === "string" ? country : undefined,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

reportingRouter.get("/by-department-country", async (req, res, next) => {
  try {
    const { department, country } = req.query;
    const result = await reportingService.getDepartmentCountryReport({
      department: typeof department === "string" ? department : undefined,
      country: typeof country === "string" ? country : undefined,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

reportingRouter.get("/salary-distribution", async (req, res, next) => {
  try {
    const bandCount = req.query.bands ? Number(req.query.bands) : undefined;
    res.json(await reportingService.getSalaryDistribution(undefined, bandCount));
  } catch (err) {
    next(err);
  }
});
