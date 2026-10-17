
import type { Request, Response } from "express";
import {
    getExternalWeather as getStoredWeather,
    updateExternalWeather as storeWeather,
    type WeatherSource
} from "../services/weatherService.js";

export function receiveExternalWeather(
    req: Request,
    res: Response
) {
    const { temperature, humidity, source, observedAt } = req.body;

    if (
        typeof temperature !== "number" ||
        !Number.isFinite(temperature)
    ) {
        return res.status(400).json({
            message: "Temperature must be a finite number"
        });
    }

    if (
        typeof humidity !== "number" ||
        !Number.isFinite(humidity) ||
        humidity < 0 ||
        humidity > 100
    ) {
        return res.status(400).json({
            message: "Humidity must be a number between 0 and 100"
        });
    }

    if (
        source !== "OPEN_METEO" &&
        source !== "FALLBACK"
    ) {
        return res.status(400).json({
            message: "Invalid weather source"
        });
    }

    if (
        typeof observedAt !== "string" ||
        !Number.isFinite(Date.parse(observedAt))
    ) {
        return res.status(400).json({
            message: "Invalid observation timestamp"
        });
    }

    const weather = storeWeather({
        temperature,
        humidity,
        source: source as WeatherSource,
        observedAt
    });

    return res.status(200).json({
        message: "External weather updated successfully",
        weather
    });
}

export function getExternalWeather(
    _req: Request,
    res: Response
) {
    return res.status(200).json({
        weather: getStoredWeather()
    });
}
