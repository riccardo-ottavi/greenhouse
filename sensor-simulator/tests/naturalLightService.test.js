
import { test, expect } from "@jest/globals";
import { getNaturalLight } from "../src/services/naturalLightService.js";
import { getSolarTimes } from "../src/services/solarTimesService.js";
import simulationConfig from "../src/config/simulationConfig.js";

const { longitude, timezone } = simulationConfig.location;

function localTime(date, hour, minute = 0) {
    const [year, month, day] = date.split("-").map(Number);

    const utcOffset =
        new Intl.DateTimeFormat("en-GB", {
            timeZone: timezone,
            timeZoneName: "longOffset"
        })
            .formatToParts(
                new Date(Date.UTC(year, month - 1, day, 12))
            )
            .find((part) => part.type === "timeZoneName")
            .value;

    const match = utcOffset.match(/GMT([+-])(\d{2}):(\d{2})/);

    const offsetMinutes = match
        ? (match[1] === "+" ? 1 : -1) *
          (Number(match[2]) * 60 + Number(match[3]))
        : 0;

    return new Date(
        Date.UTC(
            year,
            month - 1,
            day,
            hour,
            minute
        ) - offsetMinutes * 60_000
    );
}

function getSolarTimesFor(date) {
    return getSolarTimes(
        localTime(date, 12),
        simulationConfig.location.latitude,
        longitude,
        timezone
    );
}

function getClockMinutes(solarTime) {
    const [, hour, minute] =
        solarTime.match(/T(\d{2}):(\d{2})$/);

    return Number(hour) * 60 + Number(minute);
}

function getSolarMidpoint(solarTimes) {
    const sunrise = getClockMinutes(solarTimes.sunrise);
    const sunset = getClockMinutes(solarTimes.sunset);
    const midpoint = Math.floor((sunrise + sunset) / 2);

    return localTime(
        solarTimes.date,
        Math.floor(midpoint / 60),
        midpoint % 60
    );
}

test("returns zero before sunrise", () => {
    const solarTimes = getSolarTimesFor("2026-06-21");
    const sunrise = getClockMinutes(solarTimes.sunrise);

    expect(
        getNaturalLight(
            {},
            localTime(solarTimes.date, 0).getTime() >= 0
                ? localTime(
                    solarTimes.date,
                    Math.floor((sunrise - 1) / 60),
                    (sunrise - 1) % 60
                )
                : new Date()
        )
    ).toBe(0);
});

test("returns zero exactly at sunrise", () => {
    const solarTimes = getSolarTimesFor("2026-06-21");
    const sunrise = getClockMinutes(solarTimes.sunrise);

    expect(
        getNaturalLight(
            {},
            localTime(
                solarTimes.date,
                Math.floor(sunrise / 60),
                sunrise % 60
            )
        )
    ).toBe(0);
});

test("reaches the configured maximum around the midpoint between sunrise and sunset", () => {
    const solarTimes = getSolarTimesFor("2026-06-21");

    expect(solarTimes.sunrise).not.toBeNull();
    expect(solarTimes.sunset).not.toBeNull();

    expect(
        getNaturalLight({}, getSolarMidpoint(solarTimes))
    ).toBeCloseTo(
        simulationConfig.sensors.light.naturalLight.daylightMax,
        0
    );
});

test("returns zero exactly at sunset", () => {
    const solarTimes = getSolarTimesFor("2026-06-21");
    const sunset = getClockMinutes(solarTimes.sunset);

    expect(
        getNaturalLight(
            {},
            localTime(
                solarTimes.date,
                Math.floor(sunset / 60),
                sunset % 60
            )
        )
    ).toBe(0);
});

test("returns zero after sunset", () => {
    const solarTimes = getSolarTimesFor("2026-06-21");
    const sunset = getClockMinutes(solarTimes.sunset);
    const afterSunset = sunset + 1;

    expect(
        getNaturalLight(
            {},
            localTime(
                solarTimes.date,
                Math.floor(afterSunset / 60),
                afterSunset % 60
            )
        )
    ).toBe(0);
});

test("uses the hourly fallback when astronomical solar times are unavailable", () => {
    const originalLatitude =
        simulationConfig.location.latitude;

    try {
        simulationConfig.location.latitude = 90;

        const now = localTime("2026-06-21", 7, 30);
        const solarTimes = getSolarTimesFor("2026-06-21");

        expect(solarTimes.sunrise).toBeNull();
        expect(solarTimes.sunset).toBeNull();

        expect(
            getNaturalLight({}, now)
        ).toBeCloseTo(5000);
    } finally {
        simulationConfig.location.latitude = originalLatitude;
    }
});

test("uses Europe/Rome when the computer time is represented in UTC", () => {
    const utcInstant = new Date("2026-06-21T10:00:00Z");
    const solarTimes = getSolarTimesFor("2026-06-21");
    const expected = getNaturalLight(
        {},
        getSolarMidpoint(solarTimes)
    );

    expect(
        getNaturalLight({}, utcInstant)
    ).toBeGreaterThan(0);

    expect(expected).toBeCloseTo(
        simulationConfig.sensors.light.naturalLight.daylightMax,
        0
    );
});

test("handles the winter UTC offset correctly", () => {
    const solarTimes = getSolarTimesFor("2026-12-21");

    expect(solarTimes.sunrise).not.toBeNull();
    expect(solarTimes.sunset).not.toBeNull();

    expect(
        getNaturalLight({}, getSolarMidpoint(solarTimes))
    ).toBeCloseTo(
        simulationConfig.sensors.light.naturalLight.daylightMax,
        0
    );
});

test("uses the fallback when the astronomical calculation is unavailable even if weather has solar times", () => {
    const originalLatitude =
        simulationConfig.location.latitude;

    try {
        simulationConfig.location.latitude = 90;

        expect(
            getNaturalLight(
                {
                    sunrise: "2026-06-21T06:00",
                    sunset: "2026-06-21T18:00"
                },
                localTime("2026-06-21", 7, 30)
            )
        ).toBeCloseTo(5000);
    } finally {
        simulationConfig.location.latitude = originalLatitude;
    }
});
