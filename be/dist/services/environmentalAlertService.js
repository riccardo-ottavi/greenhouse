"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEnvironmentalAlert = getEnvironmentalAlert;
exports.evaluateEnvironmentalAlert = evaluateEnvironmentalAlert;
exports.getActiveEnvironmentalAlerts = getActiveEnvironmentalAlerts;
const environmentalAlertRepository_js_1 = require("../repositories/environmentalAlertRepository.js");
function getEnvironmentalAlert(sensorType, value) {
    switch (sensorType) {
        case "TEMPERATURE":
            return value > 30
                ? "HIGH_TEMPERATURE"
                : null;
        case "HUMIDITY":
            return value > 80
                ? "HIGH_HUMIDITY"
                : null;
        case "SOIL_MOISTURE":
            return value < 20
                ? "LOW_SOIL_MOISTURE"
                : null;
        case "LIGHT":
            return value < 5000
                ? "LOW_LIGHT"
                : null;
    }
}
async function evaluateEnvironmentalAlert(sensorId, sensorType, value, timestamp) {
    const alertType = getEnvironmentalAlert(sensorType, value);
    const activeAlertTypes = [
        "HIGH_TEMPERATURE",
        "HIGH_HUMIDITY",
        "LOW_SOIL_MOISTURE",
        "LOW_LIGHT"
    ];
    for (const type of activeAlertTypes) {
        const activeAlert = await (0, environmentalAlertRepository_js_1.findActiveAlertBySensorAndType)(sensorId, type);
        if (type === alertType) {
            if (!activeAlert) {
                await (0, environmentalAlertRepository_js_1.createEnvironmentalAlert)(sensorId, type, value, timestamp);
            }
        }
        else if (activeAlert) {
            await (0, environmentalAlertRepository_js_1.resolveEnvironmentalAlert)(activeAlert.id, timestamp);
        }
    }
}
async function getActiveEnvironmentalAlerts() {
    return (0, environmentalAlertRepository_js_1.findActiveEnvironmentalAlerts)();
}
