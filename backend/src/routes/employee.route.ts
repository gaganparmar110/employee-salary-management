import { Router } from "express";
import { requireHrManager, type AuthenticatedRequest } from "../middleware/auth.middleware.js";
import { sendSuccess } from "../lib/apiResponse.js";
import * as employeeService from "../services/employee.service.js";
import { NotFoundError } from "../services/errors.js";

export const employeeRouter = Router();

// Everything in this router is salary data — gated behind the one
// centralized auth check for every route below.
employeeRouter.use(requireHrManager);

employeeRouter.post("/", async (req: AuthenticatedRequest, res, next) => {
  try {
    const result = await employeeService.createEmployee(req.body, req.hrManager!.id);
    sendSuccess(res, result, { status: 201, message: "Employee created successfully" });
  } catch (err) {
    next(err);
  }
});

employeeRouter.get("/", async (req, res, next) => {
  try {
    const { department, country, search, page, pageSize } = req.query;
    const result = await employeeService.listEmployees({
      department: typeof department === "string" ? department : undefined,
      country: typeof country === "string" ? country : undefined,
      search: typeof search === "string" ? search : undefined,
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
    });
    sendSuccess(res, result, { message: "Employees fetched successfully" });
  } catch (err) {
    next(err);
  }
});

employeeRouter.get("/:id", async (req, res, next) => {
  try {
    const employee = await employeeService.getEmployee(req.params.id);
    if (!employee) {
      // Routed through the centralized error handler, same as every other
      // NotFoundError, rather than a one-off response shape.
      throw new NotFoundError(`Employee ${req.params.id} not found`);
    }
    sendSuccess(res, employee, { message: "Employee fetched successfully" });
  } catch (err) {
    next(err);
  }
});

employeeRouter.get("/:id/salary-history", async (req, res, next) => {
  try {
    const history = await employeeService.getSalaryHistory(req.params.id);
    sendSuccess(res, history, { message: "Salary history fetched successfully" });
  } catch (err) {
    next(err);
  }
});

employeeRouter.post("/:id/salary", async (req: AuthenticatedRequest, res, next) => {
  try {
    const result = await employeeService.updateSalary(req.params.id, req.body, req.hrManager!.id);
    sendSuccess(res, result, { message: "Salary updated successfully" });
  } catch (err) {
    next(err);
  }
});
