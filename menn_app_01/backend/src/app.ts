import "dotenv/config";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import passport from "passport";

import { env } from "./config/env.js";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware.js";
import { globalRateLimiter } from "./middleware/rate-limit.middleware.js";
import { registerGoogleStrategy } from "./modules/auth/strategies/google.strategy.js";

import authRouter from "./modules/auth/auth.router.js";
import productRoutes from "./modules/product/product.routes.js";

// Register Passport strategies
registerGoogleStrategy();

const app = express();

// ─── Security Middleware ──────────────────────────────────────────────────────
app.use(helmet());
app.disable("x-powered-by");
app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
  })
);

// ─── Body / Cookie Parsing ────────────────────────────────────────────────────
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ─── Passport (stateless — no sessions) ──────────────────────────────────────
app.use(passport.initialize());

// ─── Rate Limiting ────────────────────────────────────────────────────────────
app.use(globalRateLimiter);

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.status(200).json({ success: true, message: "API is running" });
});

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/products", productRoutes);

// ─── Error Handling ────────────────────────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

export default app;