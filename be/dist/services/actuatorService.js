"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllActuators = getAllActuators;
exports.getActuatorById = getActuatorById;
exports.updateActuatorStatus = updateActuatorStatus;
exports.getActuatorsByDeviceId = getActuatorsByDeviceId;
const AppError_js_1 = require("../errors/AppError.js");
const actuatorRepository_js_1 = require("../repositories/actuatorRepository.js");
async function getAllActuators() {
    return (0, actuatorRepository_js_1.getAllActuators)();
}
async function getActuatorById(id) {
    return (0, actuatorRepository_js_1.getActuatorById)(id);
}
async function updateActuatorStatus(deviceId, actuatorId, state, controlMode) {
    const updated = await (0, actuatorRepository_js_1.updateActuatorStatus)(deviceId, actuatorId, state, controlMode);
    if (!updated) {
        throw new AppError_js_1.AppError("Actuator not found for the specified device", 404);
    }
}
async function getActuatorsByDeviceId(deviceId) {
    return (0, actuatorRepository_js_1.getActuatorsByDeviceId)(deviceId);
}
