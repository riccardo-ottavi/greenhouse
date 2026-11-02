"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.index = index;
exports.show = show;
exports.heartbeat = heartbeat;
exports.updateStatus = updateStatus;
exports.getConfig = getConfig;
exports.getDeviceSensors = getDeviceSensors;
const actuatorService_1 = require("../services/actuatorService");
const deviceService_1 = require("../services/deviceService");
const sensorService_1 = require("../services/sensorService");
async function index(req, res) {
    try {
        const devices = await (0, deviceService_1.getAllDevices)();
        res.json(devices);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({
            message: "Couldn't get devices"
        });
    }
}
async function show(req, res) {
    try {
        const id = Number(req.params.id);
        if (Number.isNaN(id)) {
            res.status(400).json({
                message: "Device id must be a number"
            });
            return;
        }
        const device = await (0, deviceService_1.getDeviceById)(id);
        if (!device) {
            res.status(404).json({
                message: "Device not found"
            });
            return;
        }
        res.json(device);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({
            message: "Couldn't get device's data"
        });
    }
}
async function heartbeat(req, res) {
    try {
        const deviceId = req.authenticatedDeviceId;
        if (!deviceId) {
            res.status(401).json({
                message: "Authenticated device is required"
            });
            return;
        }
        const updated = await (0, deviceService_1.updateHeartbeat)(deviceId);
        if (!updated) {
            res.status(404).json({
                message: "Device not found"
            });
            return;
        }
        res.json({
            message: "Heartbeat received"
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({
            message: "Couldn't update device heartbeat"
        });
    }
}
async function updateStatus(req, res) {
    try {
        const deviceId = req.authenticatedDeviceId;
        const { actuators } = req.body;
        if (!deviceId) {
            res.status(401).json({
                message: "Authenticated device is required"
            });
            return;
        }
        if (!Array.isArray(actuators)) {
            res.status(400).json({
                message: "actuators must be an array"
            });
            return;
        }
        for (const actuator of actuators) {
            if (typeof actuator.actuatorId !== "number" ||
                !["ON", "OFF"].includes(actuator.state) ||
                !["AUTO", "MANUAL"].includes(actuator.controlMode)) {
                res.status(400).json({
                    message: "Invalid actuator status"
                });
                return;
            }
            await (0, actuatorService_1.updateActuatorStatus)(deviceId, actuator.actuatorId, actuator.state, actuator.controlMode);
        }
        res.json({
            message: "Device status updated"
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({
            message: "Couldn't update device status"
        });
    }
}
async function getConfig(req, res) {
    try {
        const deviceId = req.authenticatedDeviceId;
        if (!deviceId) {
            res.status(401).json({
                message: "Authenticated device is required"
            });
            return;
        }
        const [actuators, sensors] = await Promise.all([
            (0, deviceService_1.getDeviceActuatorStates)(deviceId),
            (0, deviceService_1.getDeviceSensorConfigs)(deviceId)
        ]);
        res.json({
            deviceId,
            actuators,
            sensors
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({
            message: "Couldn't get device configuration"
        });
    }
}
async function getDeviceSensors(req, res) {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            res.status(400).json({
                message: "Device id must be a positive integer"
            });
            return;
        }
        const device = await (0, deviceService_1.getDeviceById)(id);
        if (!device) {
            res.status(404).json({
                message: "Device not found"
            });
            return;
        }
        const sensors = await (0, sensorService_1.getSensorViewsByDeviceId)(id);
        res.json(sensors);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({
            message: "Couldn't get device sensors"
        });
    }
}
