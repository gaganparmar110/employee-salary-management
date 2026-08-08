import { Router } from "express";
import { requireHrManager } from "../middleware/auth.middleware.js";
import { sendSuccess } from "../lib/apiResponse.js";
import * as reportingService from "../services/reporting.service.js";

export const reportingRouter = Router();

reportingRouter.use(requireHrManager);

reportingRouter.get("/by-department", async (_req, res, next) => {
  try {
    const result = await reportingService.getDepartmentReport();
    sendSuccess(res, result, { message: "Department report fetched successfully" });
  } catch (err) {
    next(err);
  }
});

reportingRouter.get("/by-country", async (_req, res, next) => {
  try {
    const result = await reportingService.getCountryReport();
    sendSuccess(res, result, { message: "Country report fetched successfully" });
  } catch (err) {
    next(err);
  }
});

reportingRouter.get("/overview", async (_req, res, next) => {
  try {
    const result = await reportingService.getOverview();
    sendSuccess(res, result, { message: "Overview report fetched successfully" });
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
    sendSuccess(res, result, { message: "Top earners fetched successfully" });
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
    sendSuccess(res, result, { message: "Pay-over-time report fetched successfully" });
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
    sendSuccess(res, result, { message: "Department-country report fetched successfully" });
  } catch (err) {
    next(err);
  }
});

reportingRouter.get("/salary-distribution", async (req, res, next) => {
  try {
    const bandCount = req.query.bands ? Number(req.query.bands) : undefined;
    const result = await reportingService.getSalaryDistribution(undefined, bandCount);
    sendSuccess(res, result, { message: "Salary distribution fetched successfully" });
  } catch (err) {
    next(err);
  }
});
