
import { Router } from "express";
import {
  login,
  logout,
  me
} from "../controllers/authController.js";
import {
  issueCsrfToken,
  requireCsrfToken
} from "../middlewares/csrfProtection.js";
import {
  createLoginRateLimiter,
  loginRateLimiter
} from "../middlewares/loginRateLimiter.js";
import { requireAuth } from "../middlewares/requireAuth.js";

export function createAuthRouter(
  rateLimiter = loginRateLimiter
) {
  const router = Router();

  router.get("/csrf", issueCsrfToken);
  router.post("/login", rateLimiter, requireCsrfToken, login);
  router.get("/me", me);
  router.post("/logout", requireAuth, requireCsrfToken, logout);

  return router;
}

export { createLoginRateLimiter };

export default createAuthRouter();
