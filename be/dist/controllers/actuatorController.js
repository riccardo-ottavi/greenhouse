"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.index = index;
exports.show = show;
exports.command = command;
exports.getDeviceActuators = getDeviceActuators;
const AppError_js_1 = require("../errors/AppError.js");
const actuatorService_js_1 = require("../services/actuatorService.js");
const commandService_js_1 = require("../services/commandService.js");
const deviceRepository_js_1 = require("../repositories/deviceRepository.js");
async function index(_req, res) {
    const actuators = await (0, actuatorService_js_1.getAllActuators)();
    res.json(actuators);
}
async function show(req, res) {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
        throw new AppError_js_1.AppError("Actuator id must be a number", 400);
    }
    const actuator = await (0, actuatorService_js_1.getActuatorById)(id);
    if (!actuator) {
        throw new AppError_js_1.AppError("Actuator not found", 404);
    }
    res.json(actuator);
}
async function command(req, res) {
    const actuatorId = Number(req.params.id);
    if (Number.isNaN(actuatorId)) {
        throw new AppError_js_1.AppError("Actuator id must be a number", 400);
    }
    const { type, state, controlMode } = req.body;
    const command = await (0, commandService_js_1.createCommand)(actuatorId, type, state ?? null, controlMode ?? null);
    res.status(201).json(command);
}
async function getDeviceActuators(req, res) {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
        throw new AppError_js_1.AppError("Device id must be a positive integer", 400);
    }
    const device = await (0, deviceRepository_js_1.getDeviceById)(id);
    if (!device) {
        throw new AppError_js_1.AppError("Device not found", 404);
    }
    const actuators = await (0, actuatorService_js_1.getActuatorsByDeviceId)(id);
    res.json(actuators);
}
