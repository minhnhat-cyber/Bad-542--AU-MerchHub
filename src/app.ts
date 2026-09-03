import cors from "cors";
import express from "express";
import helmet from "helmet";
import { prisma } from "./lib/prisma.js";
import { categoryRouter } from "./routes/categories.routes.js";

export const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use("/api/categories", categoryRouter);

app.get("/api/health", async (_request, response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    response.status(200).json({
      success: true,
      message: "AU MerchHub API is running",
      database: "connected",
    });
  } catch {
    response.status(503).json({
      success: false,
      message: "AU MerchHub API is unavailable",
      database: "disconnected",
    });
  }
});

app.use((_request, response) => {
  response.status(404).json({
    success: false,
    error: "Route not found",
  });
});