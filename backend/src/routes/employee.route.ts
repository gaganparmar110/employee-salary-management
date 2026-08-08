import { Router } from "express";
import { requireHrManager, type AuthenticatedRequest } from "../middleware/auth.middleware.js";
import * as employeeService from "../services/employee.service.js";

export const employeeRouter = Router();

// Everything in this router is salary data — gated behind the one
// centralized auth check for every route below.
employeeRouter.use(requireHrManager);

employeeRouter.post("/", async (req: AuthenticatedRequest, res, next) => {
  try {
    const result = await employeeService.createEmployee(req.body, req.hrManager!.id);
    res.status(201).json(result);
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
    res.json(result);
  } catch (err) {
    next(err);
  }
});

employeeRouter.get("/:id", async (req, res, next) => {
  try {
    const employee = await employeeService.getEmployee(req.params.id);
    if (!employee) {
      res.status(404).json({ error: `Employee ${req.params.id} not found` });
      return;
    }
    res.json(employee);
  } catch (err) {
    next(err);
  }
});

employeeRouter.get("/:id/salary-history", async (req, res, next) => {
  try {
    res.json(await employeeService.getSalaryHistory(req.params.id));
  } catch (err) {
    next(err);
  }
});

employeeRouter.post("/:id/salary", async (req: AuthenticatedRequest, res, next) => {
  try {
    const result = await employeeService.updateSalary(req.params.id, req.body, req.hrManager!.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
});
