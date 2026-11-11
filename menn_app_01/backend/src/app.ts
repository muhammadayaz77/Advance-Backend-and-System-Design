import dns from "dns";
import express from "express";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import cors from "cors";
import { rateLimit } from "express-rate-limit";
import passport from "passport";

import { env } from "./config/env.js";
import { wrapResponseMiddleware } from "./middleware/wrap-response.js";
import { authenticate } from "./middleware/authenticate.js";
import { errorHandler, notFoundHandler } from "./middleware/error-handler.js";

import { registerJwtStrategy } from "./auth/strategies/jwt.strategy.js";
import { registerJwtRefreshStrategy } from "./auth/strategies/jwt-refresh.strategy.js";
import { registerGoogleStrategy } from "./auth/strategies/google.strategy.js";

import authRouter from "./auth/auth.router.js";
import articleRouter from "./modules/articles/article.routes.js"
import commentRouter from "./modules/comments/comment.routes.js"

// 1. DNS fix (prevents IPv6 SMTP issues)
dns.setDefaultResultOrder("ipv4first");

// Initialize Passport Strategies
registerJwtStrategy();
registerJwtRefreshStrategy();
registerGoogleStrategy();

const app = express();

// 2. Helmet (security headers)
app.use(helmet());
app.disable("x-powered-by");

// 3. Cookie parser (required for refresh token)
app.use(cookieParser());

// 4. Body parsing with increased limits (for file uploads)
app.use(express.json({ limit: "105mb" }));
app.use(express.urlencoded({ limit: "105mb", extended: true }));

// 5. CORS
app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// 6. Rate limiting (60 requests per minute)
app.use(
  rateLimit({
    windowMs: 60_000,
    limit: 60,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      statusCode: 429,
      timestamp: new Date().toISOString(),
      message: "Too many requests. Please try again later.",
    },
  })
);

// 7. Passport initialization (stateless — no sessions)
app.use(passport.initialize());

// 8. Success envelope wrapper middleware
app.use(wrapResponseMiddleware);

// 9. Global JWT extraction middleware (populates req.user if valid)
app.use(authenticate);

// ─── Health Check Routes ──────────────────────────────────────────────────────
app.get("/api/v1", (_req, res) => {
  res.status(200).json("Hello World!");
});

app.get("/health", (_req, res) => {
  res.status(200).json("Hello World!");
});

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use("/api/v1/auth", authRouter);

// ─── Articlres ───────────────────────────────────────────────────────────
app.use("/api/v1/articles",articleRouter)

// ─── Comments ───────────────────────────────────────────────────────────
app.use("/api/v1/comments",commentRouter)

// ─── Error Handling ───────────────────────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
