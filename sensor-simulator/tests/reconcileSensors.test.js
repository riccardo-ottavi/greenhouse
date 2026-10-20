
import { test, jest, expect } from "@jest/globals";
import assert from "node:assert/strict";
import { reconcileSensors } from "../src/utils/reconcileSensors.js";

const simulationConfig = {
    sensors: {
        temperature: { initialValue: 22 },
        humidity: { initialValue: 65 },
        soilMoisture: { initialValue: 45 },
        light: { initialValue: 10000 }
    }
};

const allSensors = {
    1: { name: "Temperature", type: "TEMPERATURE", samplingInterval: 5 },
    2: { name: "Humidity", type: "HUMIDITY", samplingInterval: 5 },
    3: { name: "Soil Moisture", type: "SOIL_MOISTURE", samplingInterval: 5 },
    4: { name: "Light", type: "LIGHT", samplingInterval: 5 }
};

test("initializes all four configured sensors", () => {
    const result = reconcileSensors([], allSensors, simulationConfig);

    assert.equal(result.length, 4);
    assert.deepEqual(
        result.map((sensor) => sensor.type),
        ["TEMPERATURE", "HUMIDITY", "SOIL_MOISTURE", "LIGHT"]
    );
    assert.deepEqual(
        result.map((sensor) => sensor.currentValue),
        [22, 65, 45, 10000]
    );
});

test("keeps only sensors present in a partial configuration", () => {
    const partialConfig = {
        1: allSensors[1],
        2: allSensors[2]
    };

    const result = reconcileSensors(
        [
            { id: 1, name: "Temperature", type: "TEMPERATURE", currentValue: 23 },
            { id: 2, name: "Humidity", type: "HUMIDITY", currentValue: 67 },
            { id: 3, name: "Soil Moisture", type: "SOIL_MOISTURE", currentValue: 40 },
            { id: 4, name: "Light", type: "LIGHT", currentValue: 9000 }
        ],
        partialConfig,
        simulationConfig
    );

    assert.equal(result.length, 2);
    assert.deepEqual(result.map((sensor) => sensor.id), [1, 2]);
    assert.deepEqual(result.map((sensor) => sensor.currentValue), [23, 67]);
});

test("preserves the current value of an unchanged sensor", () => {
    const currentSensors = [
        { id: 1, name: "Old name", type: "TEMPERATURE", currentValue: 24 }
    ];

    const result = reconcileSensors(
        currentSensors,
        { 1: allSensors[1] },
        simulationConfig
    );

    assert.equal(result[0].currentValue, 24);
    assert.equal(result[0].name, "Temperature");
});

test("resets a sensor when its type changes", () => {
    const currentSensors = [
        { id: 1, name: "Temperature", type: "TEMPERATURE", currentValue: 30 }
    ];

    const result = reconcileSensors(
        currentSensors,
        {
            1: {
                name: "Humidity",
                type: "HUMIDITY",
                samplingInterval: 5
            }
        },
        simulationConfig
    );

    assert.equal(result.length, 1);
    assert.equal(result[0].type, "HUMIDITY");
    assert.equal(result[0].currentValue, 65);
});

test("ignores unsupported sensor types", () => {
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});

    try {
        const result = reconcileSensors(
            [],
            { 99: { name: "Unknown", type: "UNKNOWN" } },
            simulationConfig
        );

        assert.deepEqual(result, []);
        expect(warnSpy).toHaveBeenCalledWith(
            "Unsupported sensor type: UNKNOWN"
        );
    } finally {
        warnSpy.mockRestore();
    }
});


