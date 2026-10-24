
import { test, expect } from "@jest/globals";
import { getNaturalLight } from "../src/services/naturalLightService.js";

const weather = {
    sunrise: "2026-06-21T06:00",
    sunset: "2026-06-21T18:00"
};

function localTime(hour, minute = 0) {
    return new Date(2026, 5, 21, hour, minute);
}

test("returns zero before sunrise", () => {
    expect(
        getNaturalLight(weather, localTime(5, 59))
    ).toBe(0);
});

test("returns zero exactly at sunrise", () => {
    expect(
        getNaturalLight(weather, localTime(6))
    ).toBe(0);
});

test("reaches the configured maximum at solar noon", () => {
    expect(
        getNaturalLight(weather, localTime(12))
    ).toBeCloseTo(30000);
});

test("returns zero exactly at sunset", () => {
    expect(
        getNaturalLight(weather, localTime(18))
    ).toBe(0);
});

test("returns zero after sunset", () => {
    expect(
        getNaturalLight(weather, localTime(18, 1))
    ).toBe(0);
});

test("uses the hourly fallback when solar times are missing", () => {
    expect(
        getNaturalLight({}, localTime(7, 30))
    ).toBeCloseTo(5000);
});

test("uses the hourly fallback when solar times are invalid", () => {
    expect(
        getNaturalLight(
            {
                sunrise: "invalid",
                sunset: "invalid"
            },
            localTime(7, 30)
        )
    ).toBeCloseTo(5000);
});

test("uses Europe/Rome when the computer time is represented in UTC", () => {
    const utcInstant = new Date("2026-06-21T10:00:00Z");

    expect(
        getNaturalLight(
            {
                ...weather,
                timezone: "Europe/Rome"
            },
            utcInstant
        )
    ).toBeCloseTo(30000);
});

test("handles the winter UTC offset correctly", () => {
    const winterWeather = {
        sunrise: "2026-12-21T08:00",
        sunset: "2026-12-21T16:30",
        timezone: "Europe/Rome"
    };

    const utcInstant = new Date("2026-12-21T11:15:00Z");

    expect(
        getNaturalLight(winterWeather, utcInstant)
    ).toBeCloseTo(30000);
});

test("uses the fallback when sunrise and sunset refer to different dates", () => {
    const invalidWeather = {
        sunrise: "2026-06-20T06:00",
        sunset: "2026-06-21T18:00",
        timezone: "Europe/Rome"
    };

    const utcInstant = new Date("2026-06-21T05:30:00Z");

    expect(
        getNaturalLight(invalidWeather, utcInstant)
    ).toBeCloseTo(5000);
});