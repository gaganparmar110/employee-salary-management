import "dotenv/config";
import express from "express";
import cors from "cors";
import { healthRouter } from "./routes/health.route.js";
import { authRouter } from "./routes/auth.route.js";
import { employeeRouter } from "./routes/employee.route.js";
import { errorHandler } from "./middleware/error.middleware.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/v1/health", healthRouter);
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/employees", employeeRouter);

// Must be registered after all routes — Express recognizes error
// middleware by its 4-argument signature.
app.use(errorHandler);

const port = process.env.PORT ? Number(process.env.PORT) : 4000;

app.listen(port, () => {
  console.log(`Backend listening on http://localhost:${port}`);
});
