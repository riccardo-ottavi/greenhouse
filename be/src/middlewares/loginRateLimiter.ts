
import rateLimit from "express-rate-limit";

export function createLoginRateLimiter() {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: {
      message: "Too many login attempts. Please try again later."
    }
  });
}

export const loginRateLimiter = createLoginRateLimiter();
