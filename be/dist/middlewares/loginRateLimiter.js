"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginRateLimiter = void 0;
exports.createLoginRateLimiter = createLoginRateLimiter;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
function createLoginRateLimiter() {
    return (0, express_rate_limit_1.default)({
        windowMs: 15 * 60 * 1000,
        limit: 10,
        standardHeaders: "draft-8",
        legacyHeaders: false,
        message: {
            message: "Too many login attempts. Please try again later."
        }
    });
}
exports.loginRateLimiter = createLoginRateLimiter();
