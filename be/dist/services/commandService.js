"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPendingCommands = getPendingCommands;
exports.completeCommand = completeCommand;
exports.createCommand = createCommand;
const AppError_js_1 = require("../errors/AppError.js");
const commandRepository_js_1 = require("../repositories/commandRepository.js");
async function getPendingCommands(deviceId) {
    return (0, commandRepository_js_1.getPendingCommands)(deviceId);
}
async function completeCommand(commandId, deviceId, success) {
    await (0, commandRepository_js_1.completeCommand)(commandId, deviceId, success);
}
async function createCommand(actuatorId, type, state, controlMode) {
    const actuator = await (0, commandRepository_js_1.getActuatorForCommand)(actuatorId);
    if (!actuator) {
        throw new AppError_js_1.AppError("Actuator not found", 404);
    }
    if (type !== "SET_ACTUATOR_STATE" &&
        type !== "SET_CONTROL_MODE") {
        throw new AppError_js_1.AppError("Invalid command type", 400);
    }
    if (state !== null &&
        state !== "ON" &&
        state !== "OFF") {
        throw new AppError_js_1.AppError("Invalid actuator state", 400);
    }
    if (controlMode !== null &&
        controlMode !== "AUTO" &&
        controlMode !== "MANUAL") {
        throw new AppError_js_1.AppError("Invalid control mode", 400);
    }
    if (type === "SET_ACTUATOR_STATE") {
        if (state === null ||
            controlMode !== null) {
            throw new AppError_js_1.AppError("Invalid payload for SET_ACTUATOR_STATE", 400);
        }
    }
    if (type === "SET_CONTROL_MODE") {
        if (controlMode === null ||
            state !== null) {
            throw new AppError_js_1.AppError("Invalid payload for SET_CONTROL_MODE", 400);
        }
    }
    return (0, commandRepository_js_1.insertCommand)(actuatorId, actuator.deviceId, type, state, controlMode);
}
