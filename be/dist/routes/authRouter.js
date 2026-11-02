"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createLoginRateLimiter = void 0;
exports.createAuthRouter = createAuthRouter;
const express_1 = require("express");
const authController_js_1 = require("../controllers/authController.js");
const csrfProtection_js_1 = require("../middlewares/csrfProtection.js");
const loginRateLimiter_js_1 = require("../middlewares/loginRateLimiter.js");
Object.defineProperty(exports, "createLoginRateLimiter", { enumerable: true, get: function () { return loginRateLimiter_js_1.createLoginRateLimiter; } });
const requireAuth_js_1 = require("../middlewares/requireAuth.js");
function createAuthRouter(rateLimiter = loginRateLimiter_js_1.loginRateLimiter) {
    const router = (0, express_1.Router)();
    router.get("/csrf", csrfProtection_js_1.issueCsrfToken);
    router.post("/login", rateLimiter, csrfProtection_js_1.requireCsrfToken, authController_js_1.login);
    router.get("/me", authController_js_1.me);
    router.post("/logout", requireAuth_js_1.requireAuth, csrfProtection_js_1.requireCsrfToken, authController_js_1.logout);
    return router;
}
exports.default = createAuthRouter();
