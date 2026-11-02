"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.receiveExternalWeather = receiveExternalWeather;
exports.getExternalWeather = getExternalWeather;
const weatherService_js_1 = require("../services/weatherService.js");
function receiveExternalWeather(req, res) {
    const { temperature, humidity, source, observedAt } = req.body;
    if (typeof temperature !== "number" ||
        !Number.isFinite(temperature)) {
        return res.status(400).json({
            message: "Temperature must be a finite number"
        });
    }
    if (typeof humidity !== "number" ||
        !Number.isFinite(humidity) ||
        humidity < 0 ||
        humidity > 100) {
        return res.status(400).json({
            message: "Humidity must be a number between 0 and 100"
        });
    }
    if (source !== "OPEN_METEO" &&
        source !== "FALLBACK") {
        return res.status(400).json({
            message: "Invalid weather source"
        });
    }
    if (typeof observedAt !== "string" ||
        !Number.isFinite(Date.parse(observedAt))) {
        return res.status(400).json({
            message: "Invalid observation timestamp"
        });
    }
    const weather = (0, weatherService_js_1.updateExternalWeather)({
        temperature,
        humidity,
        source: source,
        observedAt
    });
    return res.status(200).json({
        message: "External weather updated successfully",
        weather
    });
}
function getExternalWeather(_req, res) {
    return res.status(200).json({
        weather: (0, weatherService_js_1.getExternalWeather)()
    });
}
