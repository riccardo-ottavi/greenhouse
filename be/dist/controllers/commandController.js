"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPending = getPending;
exports.commandResult = commandResult;
const AppError_js_1 = require("../errors/AppError.js");
const commandService_js_1 = require("../services/commandService.js");
async function getPending(req, res) {
    const deviceId = req.authenticatedDeviceId;
    if (!deviceId) {
        throw new AppError_js_1.AppError("Authenticated device is required", 401);
    }
    const commands = await (0, commandService_js_1.getPendingCommands)(deviceId);
    res.json({
        commands
    });
}
async function commandResult(req, res) {
    const { commandId, success } = req.body;
    const deviceId = req.authenticatedDeviceId;
    if (!deviceId) {
        throw new AppError_js_1.AppError("Authenticated device is required", 401);
    }
    if (typeof commandId !== "number" ||
        typeof success !== "boolean") {
        throw new AppError_js_1.AppError("commandId and success are required", 400);
    }
    await (0, commandService_js_1.completeCommand)(commandId, deviceId, success);
    res.json({
        message: "Command result received"
    });
}
