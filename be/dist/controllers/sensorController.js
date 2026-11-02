"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.index = index;
exports.show = show;
const sensorService_js_1 = require("../services/sensorService.js");
async function index(req, res) {
    try {
        const sensors = await (0, sensorService_js_1.getAllSensorViews)();
        res.json(sensors);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({
            message: "Couldn't get sensors"
        });
    }
}
async function show(req, res) {
    try {
        const id = Number(req.params.id);
        if (Number.isNaN(id)) {
            res.status(400).json({
                message: "Sensor id must be a number"
            });
            return;
        }
        const sensor = await (0, sensorService_js_1.getSensorViewById)(id);
        if (!sensor) {
            res.status(404).json({
                message: "Sensor not found"
            });
            return;
        }
        res.json(sensor);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({
            message: "Couldn't get sensor's data"
        });
    }
}
