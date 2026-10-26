
import simulationConfig from "../config/simulationConfig.js";
import { getSolarTimes } from "./solarTimesService.js";

const DEFAULT_TIMEZONE = "Europe/Rome";

export function getNaturalLight(_weather = {}, now = new Date()) {
    const config =
        simulationConfig.sensors.light.naturalLight;

    const { latitude, longitude, timezone } =
        simulationConfig.location;

    const current = getLocalTime(now, timezone);

    if (current === null) {
        return config.night.value;
    }

    const solarTimes = getSolarTimes(
        now,
        latitude,
        longitude,
        timezone
    );

    const sunrise = parseSolarTime(solarTimes.sunrise);
    const sunset = parseSolarTime(solarTimes.sunset);

    const hasValidSolarTimes =
        sunrise !== null &&
        sunset !== null &&
        sunrise.date === current.date &&
        sunset.date === current.date &&
        sunset.minutes > sunrise.minutes &&
        Number.isFinite(config.daylightMax) &&
        config.daylightMax >= 0;

    if (!hasValidSolarTimes) {
        return getFallbackNaturalLight(
            config,
            now,
            timezone
        );
    }

    if (
        current.minutes <= sunrise.minutes ||
        current.minutes >= sunset.minutes
    ) {
        return config.night.value;
    }

    const progress =
        (current.minutes - sunrise.minutes) /
        (sunset.minutes - sunrise.minutes);

    return (
        config.daylightMax *
        Math.sin(Math.PI * progress)
    );
}

function getLocalTime(date, timezone) {
    if (!(date instanceof Date) || !Number.isFinite(date.getTime())) {
        return null;
    }

    try {
        const parts = new Intl.DateTimeFormat("en-GB", {
            timeZone: timezone,
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hourCycle: "h23"
        }).formatToParts(date);

        const values = Object.fromEntries(
            parts.map(({ type, value }) => [type, value])
        );

        return {
            date: `${values.year}-${values.month}-${values.day}`,
            minutes:
                Number(values.hour) * 60 +
                Number(values.minute) +
                Number(values.second) / 60
        };
    } catch {
        return null;
    }
}

function parseSolarTime(value) {
    if (typeof value !== "string") {
        return null;
    }

    const match = value.match(
        /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/
    );

    if (!match) {
        return null;
    }

    const [, date, hour, minute, second = "0"] = match;

    const hours = Number(hour);
    const minutes = Number(minute);
    const seconds = Number(second);

    if (
        hours > 23 ||
        minutes > 59 ||
        seconds > 59 ||
        Number.isNaN(Date.parse(`${date}T00:00:00Z`))
    ) {
        return null;
    }

    return {
        date,
        minutes: hours * 60 + minutes + seconds / 60
    };
}

function getFallbackNaturalLight(config, now, timezone) {
    const localTime = getLocalTime(now, timezone);

    if (localTime === null) {
        return config.night.value;
    }

    const hour = localTime.minutes / 60;

    if (
        hour >= config.night.startHour ||
        hour < config.night.endHour
    ) {
        return config.night.value;
    }

    if (
        hour >= config.morning.startHour &&
        hour < config.morning.endHour
    ) {
        return interpolateLight(hour, config.morning);
    }

    if (
        hour >= config.lateMorning.startHour &&
        hour < config.lateMorning.endHour
    ) {
        return interpolateLight(hour, config.lateMorning);
    }

    if (
        hour >= config.afternoon.startHour &&
        hour < config.afternoon.endHour
    ) {
        return interpolateLight(hour, config.afternoon);
    }

    if (
        hour >= config.evening.startHour &&
        hour < config.evening.endHour
    ) {
        return interpolateLight(hour, config.evening);
    }

    return interpolateLight(hour, config.sunset);
}

function interpolateLight(hour, period) {
    const progress =
        (hour - period.startHour) /
        (period.endHour - period.startHour);

    return (
        period.startValue +
        (period.endValue - period.startValue) * progress
    );
}
