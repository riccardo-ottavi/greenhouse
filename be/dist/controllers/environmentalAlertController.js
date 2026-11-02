"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.index = index;
const environmentalAlertService_js_1 = require("../services/environmentalAlertService.js");
async function index(_req, res) {
    try {
        const alerts = await (0, environmentalAlertService_js_1.getActiveEnvironmentalAlerts)();
        res.json(alerts);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({
            message: "Couldn't get environmental alerts"
        });
    }
}
