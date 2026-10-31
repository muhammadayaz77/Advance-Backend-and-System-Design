
import { rateLimit } from "express-rate-limit";

export const globalRateLimiter = rateLimit({
  windowMs: 10 * 1000,
  limit: 5,

  standardHeaders: true,
  legacyHeaders: false,

  handler: (_req, res) => {
    console.log("Rate limit exceeded!");

    res.status(429).json({
      success: false,
      message: "Too many requests. Please try again in 10 seconds.",
    });
  },

  message: {
    success: false,
    message: "Too many requests. Please try again in 10 seconds.",
  },
});
