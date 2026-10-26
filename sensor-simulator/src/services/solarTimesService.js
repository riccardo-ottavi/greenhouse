
const DEFAULT_TIME_ZONE = "Europe/Rome";
const SUNRISE_SUNSET_ZENITH = 90.833;

export function getSolarTimes(
    date,
    latitude,
    longitude,
    timeZone = DEFAULT_TIME_ZONE
) {
    if (
        !(date instanceof Date) ||
        !Number.isFinite(date.getTime())
    ) {
        throw new Error("A valid simulation date is required.");
    }

    if (
        !Number.isFinite(latitude) ||
        latitude < -90 ||
        latitude > 90 ||
        !Number.isFinite(longitude) ||
        longitude < -180 ||
        longitude > 180
    ) {
        throw new Error("Valid latitude and longitude are required.");
    }

    const dateParts = getDateParts(date, timeZone);
    const year = Number(dateParts.year);
    const month = Number(dateParts.month);
    const day = Number(dateParts.day);

    const dayOfYear = Math.floor(
        (Date.UTC(year, month - 1, day) -
            Date.UTC(year, 0, 0)) /
        86400000
    );

    const sunrise = calculateSolarEvent(
        dayOfYear,
        latitude,
        longitude,
        true
    );

    const sunset = calculateSolarEvent(
        dayOfYear,
        latitude,
        longitude,
        false
    );

    if (sunrise === null || sunset === null) {
        return {
            sunrise: null,
            sunset: null,
            date: `${dateParts.year}-${dateParts.month}-${dateParts.day}`
        };
    }

    const baseDate = Date.UTC(year, month - 1, day);

    return {
        sunrise: formatLocalSolarTime(
            new Date(baseDate + sunrise * 60000),
            timeZone
        ),
        sunset: formatLocalSolarTime(
            new Date(baseDate + sunset * 60000),
            timeZone
        ),
        date: `${dateParts.year}-${dateParts.month}-${dateParts.day}`
    };
}

function calculateSolarEvent(
    dayOfYear,
    latitude,
    longitude,
    isSunrise
) {
    const latitudeRadians = toRadians(latitude);
    const zenithRadians = toRadians(SUNRISE_SUNSET_ZENITH);

    const gamma =
        (2 * Math.PI / 365) * (dayOfYear - 1);

    const equationOfTime =
        229.18 * (
            0.000075 +
            0.001868 * Math.cos(gamma) -
            0.032077 * Math.sin(gamma) -
            0.014615 * Math.cos(2 * gamma) -
            0.040849 * Math.sin(2 * gamma)
        );

    const solarDeclination =
        0.006918 -
        0.399912 * Math.cos(gamma) +
        0.070257 * Math.sin(gamma) -
        0.006758 * Math.cos(2 * gamma) +
        0.000907 * Math.sin(2 * gamma) -
        0.002697 * Math.cos(3 * gamma) +
        0.00148 * Math.sin(3 * gamma);

    const cosineHourAngle =
        (
            Math.cos(zenithRadians) /
            (
                Math.cos(latitudeRadians) *
                Math.cos(solarDeclination)
            )
        ) -
        Math.tan(latitudeRadians) *
        Math.tan(solarDeclination);

    if (cosineHourAngle < -1 || cosineHourAngle > 1) {
        return null;
    }

    const hourAngle = toDegrees(
        Math.acos(cosineHourAngle)
    );

    const solarNoon =
        720 - 4 * longitude - equationOfTime;

    return isSunrise
        ? solarNoon - 4 * hourAngle
        : solarNoon + 4 * hourAngle;
}

function getDateParts(date, timeZone) {
    const parts = new Intl.DateTimeFormat("en-GB", {
        timeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    }).formatToParts(date);

    return Object.fromEntries(
        parts
            .filter((part) => part.type !== "literal")
            .map((part) => [part.type, part.value])
    );
}

function formatLocalSolarTime(date, timeZone) {
    const parts = new Intl.DateTimeFormat("en-GB", {
        timeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23"
    }).formatToParts(date);

    const values = Object.fromEntries(
        parts
            .filter((part) => part.type !== "literal")
            .map((part) => [part.type, part.value])
    );

    return (
        `${values.year}-${values.month}-${values.day}` +
        `T${values.hour}:${values.minute}`
    );
}

function toRadians(degrees) {
    return degrees * Math.PI / 180;
}

function toDegrees(radians) {
    return radians * 180 / Math.PI;
}
