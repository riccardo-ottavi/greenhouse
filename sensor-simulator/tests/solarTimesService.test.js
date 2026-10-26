
import { test, expect } from "@jest/globals";
import { getSolarTimes } from "../src/services/solarTimesService.js";

const LATITUDE = 43.9;
const LONGITUDE = 12.9;

test("calculates sunrise and sunset for a summer date in Rome", () => {
    const result = getSolarTimes(
        new Date("2026-06-21T12:00:00Z"),
        LATITUDE,
        LONGITUDE
    );

    expect(result.date).toBe("2026-06-21");
    expect(result.sunrise).toMatch(/^2026-06-21T\d{2}:\d{2}$/);
    expect(result.sunset).toMatch(/^2026-06-21T\d{2}:\d{2}$/);

    const sunriseMinutes = getMinutes(result.sunrise);
    const sunsetMinutes = getMinutes(result.sunset);

    expect(sunriseMinutes).toBeGreaterThan(4 * 60);
    expect(sunriseMinutes).toBeLessThan(7 * 60);
    expect(sunsetMinutes).toBeGreaterThan(19 * 60);
    expect(sunsetMinutes).toBeLessThan(22 * 60);
    expect(sunsetMinutes).toBeGreaterThan(sunriseMinutes);
});

test("calculates shorter daylight for a winter date", () => {
    const summer = getSolarTimes(
        new Date("2026-06-21T12:00:00Z"),
        LATITUDE,
        LONGITUDE
    );

    const winter = getSolarTimes(
        new Date("2026-12-21T12:00:00Z"),
        LATITUDE,
        LONGITUDE
    );

    expect(winter.date).toBe("2026-12-21");
    expect(
        getMinutes(winter.sunset) - getMinutes(winter.sunrise)
    ).toBeLessThan(
        getMinutes(summer.sunset) - getMinutes(summer.sunrise)
    );
});

test("uses the simulated calendar date in Europe/Rome", () => {
    const result = getSolarTimes(
        new Date("2026-06-20T22:30:00Z"),
        LATITUDE,
        LONGITUDE
    );

    expect(result.date).toBe("2026-06-21");
    expect(result.sunrise.startsWith("2026-06-21")).toBe(true);
    expect(result.sunset.startsWith("2026-06-21")).toBe(true);
});

test("rejects an invalid simulation date", () => {
    expect(() =>
        getSolarTimes(
            new Date("invalid"),
            LATITUDE,
            LONGITUDE
        )
    ).toThrow("A valid simulation date is required.");
});

test("rejects invalid coordinates", () => {
    expect(() =>
        getSolarTimes(
            new Date("2026-06-21T12:00:00Z"),
            100,
            LONGITUDE
        )
    ).toThrow("Valid latitude and longitude are required.");
});

function getMinutes(localDateTime) {
    const [, hour, minute] =
        localDateTime.match(/T(\d{2}):(\d{2})$/);

    return Number(hour) * 60 + Number(minute);
}
