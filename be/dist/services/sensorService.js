"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllSensorViews = getAllSensorViews;
exports.getSensorViewById = getSensorViewById;
exports.getSensorViewsByDeviceId = getSensorViewsByDeviceId;
const sensorRepository_js_1 = require("../repositories/sensorRepository.js");
const environmentalAlertService_js_1 = require("./environmentalAlertService.js");
function toSensorView(sensor) {
    return {
        ...sensor,
        alert: (0, environmentalAlertService_js_1.getEnvironmentalAlert)(sensor.type, sensor.currentValue)
    };
}
async function getAllSensorViews() {
    const sensors = await (0, sensorRepository_js_1.getAllSensors)();
    return sensors.map(toSensorView);
}
async function getSensorViewById(id) {
    const sensor = await (0, sensorRepository_js_1.getSensorById)(id);
    if (!sensor) {
        return undefined;
    }
    return toSensorView(sensor);
}
async function getSensorViewsByDeviceId(deviceId) {
    const sensors = await (0, sensorRepository_js_1.getSensorsByDeviceId)(deviceId);
    return sensors.map(toSensorView);
}
