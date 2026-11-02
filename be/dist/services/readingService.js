"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllReadings = getAllReadings;
exports.getReadingById = getReadingById;
exports.createReading = createReading;
exports.getReadingsBySensorId = getReadingsBySensorId;
exports.validateSensorBelongsToDevice = validateSensorBelongsToDevice;
exports.createDeviceReadings = createDeviceReadings;
const connection_js_1 = require("../database/connection.js");
const AppError_js_1 = require("../errors/AppError.js");
const readingValidationService_js_1 = require("./readingValidationService.js");
const environmentalAlertService_js_1 = require("./environmentalAlertService.js");
const readingRepository_js_1 = require("../repositories/readingRepository.js");
async function getAllReadings() {
    return (0, readingRepository_js_1.getAllReadings)();
}
async function getReadingById(id) {
    return (0, readingRepository_js_1.getReadingById)(id);
}
async function createReading(reading) {
    (0, readingValidationService_js_1.validateReadingInput)(reading);
    const sensor = await (0, readingRepository_js_1.getSensorById)(reading.sensorId);
    if (!sensor) {
        throw new AppError_js_1.AppError("Sensor not found", 404);
    }
    (0, readingValidationService_js_1.validateReadingValue)(sensor.type, reading.value);
    const expectedUnit = (0, readingValidationService_js_1.getUnitFromSensorType)(sensor.type);
    if (reading.unit !== expectedUnit) {
        throw new AppError_js_1.AppError("Unit does not match sensor type", 400);
    }
    const unit = expectedUnit;
    const timestamp = new Date(reading.timestamp);
    const id = await (0, readingRepository_js_1.insertReading)(reading.sensorId, reading.value, unit, timestamp);
    await (0, readingRepository_js_1.updateSensorCurrentValue)(reading.sensorId, reading.value, timestamp);
    await (0, environmentalAlertService_js_1.evaluateEnvironmentalAlert)(reading.sensorId, sensor.type, reading.value, timestamp);
    return {
        id,
        sensorId: reading.sensorId,
        value: reading.value,
        unit,
        timestamp
    };
}
async function getReadingsBySensorId(sensorId) {
    const sensor = await (0, readingRepository_js_1.getSensorById)(sensorId);
    if (!sensor) {
        throw new AppError_js_1.AppError("Sensor not found", 404);
    }
    return (0, readingRepository_js_1.getReadingsBySensorId)(sensorId);
}
async function validateSensorBelongsToDevice(deviceId, sensorId) {
    const belongsToDevice = await (0, readingRepository_js_1.sensorBelongsToDevice)(deviceId, sensorId);
    if (!belongsToDevice) {
        throw new AppError_js_1.AppError("Sensor does not belong to device", 400);
    }
}
async function createDeviceReadings(input) {
    (0, readingValidationService_js_1.validateDeviceReadingInput)(input);
    const device = await (0, readingRepository_js_1.getDeviceByDeviceId)(input.deviceId);
    if (!device) {
        throw new AppError_js_1.AppError("Device not found", 404);
    }
    const validatedReadings = [];
    for (const reading of input.readings) {
        await validateSensorBelongsToDevice(input.deviceId, reading.sensorId);
        const sensor = await (0, readingRepository_js_1.getSensorById)(reading.sensorId);
        if (!sensor) {
            throw new AppError_js_1.AppError("Sensor not found", 404);
        }
        (0, readingValidationService_js_1.validateReadingValue)(sensor.type, reading.value);
        const expectedUnit = (0, readingValidationService_js_1.getUnitFromSensorType)(sensor.type);
        if (reading.unit !== expectedUnit) {
            throw new AppError_js_1.AppError(`Invalid unit for sensor ${reading.sensorId}`, 400);
        }
        validatedReadings.push({
            sensorId: reading.sensorId,
            sensorType: sensor.type,
            value: reading.value,
            unit: reading.unit,
            timestamp: new Date(reading.timestamp)
        });
    }
    const connection = await connection_js_1.db.getConnection();
    const createdReadings = [];
    try {
        await connection.beginTransaction();
        for (const reading of validatedReadings) {
            const id = await (0, readingRepository_js_1.insertReadingWithConnection)(connection, reading.sensorId, reading.value, reading.unit, reading.timestamp);
            await (0, readingRepository_js_1.updateSensorCurrentValueWithConnection)(connection, reading.sensorId, reading.value, reading.timestamp);
            createdReadings.push({
                id,
                sensorId: reading.sensorId,
                value: reading.value,
                unit: reading.unit,
                timestamp: reading.timestamp
            });
        }
        await connection.commit();
    }
    catch (error) {
        await connection.rollback();
        throw error;
    }
    finally {
        connection.release();
    }
    for (const reading of validatedReadings) {
        await (0, environmentalAlertService_js_1.evaluateEnvironmentalAlert)(reading.sensorId, reading.sensorType, reading.value, reading.timestamp);
    }
    return createdReadings;
}
