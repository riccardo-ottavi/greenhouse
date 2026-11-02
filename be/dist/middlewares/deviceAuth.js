"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deviceAuth = deviceAuth;
const crypto_1 = __importDefault(require("crypto"));
const deviceRepository_js_1 = require("../repositories/deviceRepository.js");
async function deviceAuth(req, res, next) {
    try {
        const apiKey = req.header("X-API-Key");
        const deviceId = req.body?.deviceId ??
            req.query.deviceId;
        if (typeof apiKey !== "string" ||
            apiKey.length === 0 ||
            typeof deviceId !== "string" ||
            deviceId.trim().length === 0) {
            res.status(401).json({
                message: "Authentication required"
            });
            return;
        }
        const apiKeyHash = await (0, deviceRepository_js_1.getDeviceApiKeyHash)(deviceId);
        if (typeof apiKeyHash !== "string" ||
            !/^[a-f0-9]{64}$/i.test(apiKeyHash)) {
            res.status(401).json({
                message: "Invalid authentication credentials"
            });
            return;
        }
        const providedApiKeyHash = crypto_1.default
            .createHash("sha256")
            .update(apiKey)
            .digest("hex");
        const isValid = crypto_1.default.timingSafeEqual(Buffer.from(providedApiKeyHash, "hex"), Buffer.from(apiKeyHash, "hex"));
        if (!isValid) {
            res.status(401).json({
                message: "Invalid authentication credentials"
            });
            return;
        }
        req.authenticatedDeviceId = deviceId;
        next();
    }
    catch (error) {
        next(error);
    }
}
