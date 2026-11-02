"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllDevices = getAllDevices;
exports.getDeviceById = getDeviceById;
exports.getDeviceActuatorStates = getDeviceActuatorStates;
exports.getDeviceSensorConfigs = getDeviceSensorConfigs;
exports.updateHeartbeat = updateHeartbeat;
exports.markOfflineDevices = markOfflineDevices;
const deviceRepository_js_1 = require("../repositories/deviceRepository.js");
const DEVICE_OFFLINE_THRESHOLD_SECONDS = 30;
async function getAllDevices() {
    return (0, deviceRepository_js_1.getAllDevices)();
}
async function getDeviceById(id) {
    return (0, deviceRepository_js_1.getDeviceById)(id);
}
async function getDeviceActuatorStates(deviceId) {
    return (0, deviceRepository_js_1.getDeviceActuatorStates)(deviceId);
}
async function getDeviceSensorConfigs(deviceId) {
    return (0, deviceRepository_js_1.getDeviceSensorConfigs)(deviceId);
}
async function updateHeartbeat(deviceId) {
    return (0, deviceRepository_js_1.updateHeartbeat)(deviceId);
}
async function markOfflineDevices() {
    await (0, deviceRepository_js_1.markOfflineDevices)(DEVICE_OFFLINE_THRESHOLD_SECONDS);
}
