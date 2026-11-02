"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateReadingInput = validateReadingInput;
exports.validateDeviceReadingInput = validateDeviceReadingInput;
exports.validateReadingValue = validateReadingValue;
exports.getUnitFromSensorType = getUnitFromSensorType;
const AppError_js_1 = require("../errors/AppError.js");
function validateReadingInput(reading) {
    if (!reading || typeof reading !== "object") {
        throw new AppError_js_1.AppError("Invalid reading", 400);
    }
    const data = reading;
    if (typeof data.sensorId !== "number" ||
        !Number.isInteger(data.sensorId)) {
        throw new AppError_js_1.AppError("sensorId must be an integer", 400);
    }
    if (typeof data.value !== "number" ||
        !Number.isFinite(data.value)) {
        throw new AppError_js_1.AppError("value must be a finite number", 400);
    }
    if (data.unit !== "°C" &&
        data.unit !== "%" &&
        data.unit !== "lux") {
        throw new AppError_js_1.AppError("Invalid reading unit", 400);
    }
    if (typeof data.timestamp !== "string" ||
        Number.isNaN(new Date(data.timestamp).getTime())) {
        throw new AppError_js_1.AppError("Invalid reading timestamp", 400);
    }
}
function validateDeviceReadingInput(input) {
    if (!input || typeof input !== "object") {
        throw new AppError_js_1.AppError("Invalid request body", 400);
    }
    const data = input;
    if (typeof data.deviceId !== "string" ||
        data.deviceId.trim().length === 0) {
        throw new AppError_js_1.AppError("deviceId is required", 400);
    }
    if (!Array.isArray(data.readings)) {
        throw new AppError_js_1.AppError("readings must be an array", 400);
    }
    if (data.readings.length === 0) {
        throw new AppError_js_1.AppError("readings must contain at least one reading", 400);
    }
    for (const reading of data.readings) {
        validateReadingInput(reading);
    }
}
function validateReadingValue(type, value) {
    switch (type) {
        case "TEMPERATURE":
            if (value < 0 || value > 50) {
                throw new AppError_js_1.AppError("Invalid temperature value", 400);
            }
            break;
        case "HUMIDITY":
            if (value < 0 || value > 100) {
                throw new AppError_js_1.AppError("Invalid humidity value", 400);
            }
            break;
        case "SOIL_MOISTURE":
            if (value < 0 || value > 100) {
                throw new AppError_js_1.AppError("Invalid soil moisture value", 400);
            }
            break;
        case "LIGHT":
            if (value < 0) {
                throw new AppError_js_1.AppError("Invalid light value", 400);
            }
            break;
    }
}
function getUnitFromSensorType(type) {
    switch (type) {
        case "TEMPERATURE":
            return "°C";
        case "HUMIDITY":
            return "%";
        case "SOIL_MOISTURE":
            return "%";
        case "LIGHT":
            return "lux";
        default:
            throw new Error("Unsupported sensor type");
    }
}
