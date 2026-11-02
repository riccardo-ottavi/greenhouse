"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.index = index;
exports.show = show;
exports.create = create;
exports.getBySensorId = getBySensorId;
exports.createFromDevice = createFromDevice;
const AppError_1 = require("../errors/AppError");
const readingService_1 = require("../services/readingService");
async function index(_req, res) {
    const readings = await (0, readingService_1.getAllReadings)();
    res.json(readings);
}
async function show(req, res) {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
        throw new AppError_1.AppError("Reading id must be a number", 400);
    }
    const reading = await (0, readingService_1.getReadingById)(id);
    if (!reading) {
        throw new AppError_1.AppError("Reading not found", 404);
    }
    res.json(reading);
}
async function create(req, res) {
    const reading = await (0, readingService_1.createReading)(req.body);
    res.status(201).json(reading);
}
async function getBySensorId(req, res) {
    const sensorId = Number(req.params.sensorId);
    const readings = await (0, readingService_1.getReadingsBySensorId)(sensorId);
    res.json(readings);
}
async function createFromDevice(req, res) {
    const deviceId = req.authenticatedDeviceId;
    if (!deviceId) {
        throw new AppError_1.AppError("Authenticated device is required", 401);
    }
    const readings = await (0, readingService_1.createDeviceReadings)({
        ...req.body,
        deviceId
    });
    res.status(201).json(readings);
}
