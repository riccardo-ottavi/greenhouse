"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateExternalWeather = updateExternalWeather;
exports.getExternalWeather = getExternalWeather;
let latestWeather = null;
function updateExternalWeather(weather) {
    latestWeather = {
        ...weather,
        receivedAt: new Date().toISOString()
    };
    return latestWeather;
}
function getExternalWeather() {
    return latestWeather;
}
