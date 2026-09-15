import cors from "cors";
import express from "express";
import helmet from "helmet";
import { env } from "./config/env.js";
import { prisma } from "./lib/prisma.js";
import { adminRouter } from "./routes/admin.routes.js";
import { authRouter } from "./routes/auth.routes.js";
import { categoryRouter } from "./routes/categories.routes.js";
import { orderRouter } from "./routes/orders.routes.js";
import { productRouter } from "./routes/products.routes.js";

export const app = express();

app.use(helmet());
app.set("trust proxy", 1);
app.disable("x-powered-by");
app.use(
  cors({
    origin: env.CORS_ORIGINS.split(",")
      .map((origin) => origin.trim().replace(/\/+$/, ""))
      .filter(Boolean),
  }),
);
app.use(express.json());

app.use("/api/auth", authRouter);
app.use("/api/admin", adminRouter);
app.use("/api/categories", categoryRouter);
app.use("/api/orders", orderRouter);
app.use("/api/products", productRouter);

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

app.use(
  (
    error: unknown,
    _request: express.Request,
    response: express.Response,
    _next: express.NextFunction,
  ) => {
    console.error(error);
    response.status(500).json({
      success: false,
      error: "Internal server error",
    });
  },
);
