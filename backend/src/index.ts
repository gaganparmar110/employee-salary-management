import "dotenv/config";
import express from "express";
import cors from "cors";
import { healthRouter } from "./routes/health.route.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/v1/health", healthRouter);

const port = process.env.PORT ? Number(process.env.PORT) : 4000;

app.listen(port, () => {
  console.log(`Backend listening on http://localhost:${port}`);
});
