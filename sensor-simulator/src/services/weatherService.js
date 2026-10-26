import simulationConfig from "../config/simulationConfig.js";


const CACHE_DURATION = 10 * 60 * 1000;

const fallbackWeather = {
    temperature: 18,
    humidity: 70
};

let cachedWeather = null;
let cachedAt = 0;

export async function getOutsideWeather() {
    const now = Date.now();

    if (
        cachedWeather &&
        now - cachedAt < CACHE_DURATION
    ) {
        return cachedWeather;
    }

    const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${simulationConfig.location.latitude}` +
    `&longitude=${simulationConfig.location.longitude}` +
    `&current=temperature_2m,relative_humidity_2m` +
    `&daily=sunrise,sunset` +
    `&timezone=auto`;

    try {
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(
                `Weather API request failed: ${response.status}`
            );
        }

        const data = await response.json();
        const sunrise = data.daily?.sunrise?.[0] ?? null;
        const sunset = data.daily?.sunset?.[0] ?? null;
        const timezone = data.timezone;

        const temperature = data.current?.temperature_2m;
        const humidity = data.current?.relative_humidity_2m;

        if (
            typeof temperature !== "number" ||
            !Number.isFinite(temperature) ||
            typeof humidity !== "number" ||
            !Number.isFinite(humidity)
        ) {
            throw new Error(
                "Weather API returned invalid data"
            );
        }

        cachedWeather = {
            temperature,
            humidity,
            sunrise,
            sunset,
            timezone,
            source: "OPEN_METEO",
            observedAt: new Date().toISOString(),
        };

        cachedAt = Date.now();

        console.log("Weather source: Open-Meteo API", cachedWeather);

        return cachedWeather;
    } catch (error) {
        console.error(
            "Weather API error, using local fallback:",
            error.message
        );

        const weather = {
            ...getFallbackWeather(),
            source: "FALLBACK",
            observedAt: new Date().toISOString()
        };

        console.log("Weather source: LOCAL FALLBACK", weather);

        return weather;
    }
}

function getFallbackWeather() {
    fallbackWeather.temperature += randomVariation(
        -0.10,
        0.10
    );

    fallbackWeather.humidity += randomVariation(
        -0.20,
        0.20
    );

    fallbackWeather.temperature = clamp(
        fallbackWeather.temperature,
        10,
        35
    );

    fallbackWeather.humidity = clamp(
        fallbackWeather.humidity,
        20,
        95
    );

    return {
        temperature: fallbackWeather.temperature,
        humidity: fallbackWeather.humidity
    };
}

function randomVariation(min, max) {
    return Math.random() * (max - min) + min;
}

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}
