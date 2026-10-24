
import { test, jest, expect } from "@jest/globals";
import deviceState, {
    initializeDeviceState
} from "../src/state/deviceState.js";

const sendDeviceStatus = jest.fn();

const getSimulationTime = jest.fn().mockReturnValue(
    new Date("2026-10-23T10:00:00.000Z")
);

jest.unstable_mockModule(
    "../src/services/deviceService.js",
    () => ({
        BACKEND_URL: "http://localhost:3000",
        DEVICE_HEADERS: {
            "Content-Type": "application/json",
            "X-API-Key": "test-key"
        },
        sendDeviceStatus,
        sendExternalWeather: jest.fn().mockResolvedValue({ success: true })
    })
);

jest.unstable_mockModule(
    "../src/services/weatherService.js",
    () => ({
        getOutsideWeather: jest.fn().mockResolvedValue({
            temperature: 18,
            humidity: 70,
            source: "test",
            observedAt: new Date().toISOString()
        })
    })
);

jest.unstable_mockModule(
    "../src/services/photoperiodService.js",
    () => ({
        updatePhotoperiod: jest.fn()
    })
);

jest.unstable_mockModule(
    "../src/services/naturalLightService.js",
    () => ({
        getNaturalLight: jest.fn()
    })
);

jest.unstable_mockModule(
    "../src/services/simulationClock.js",
    () => ({
        getSimulationTime
    })
);

const { runSimulation } = await import(
    "../src/services/simulationService.js"
);

const { updatePhotoperiod } = await import(
    "../src/services/photoperiodService.js"
);

const { getNaturalLight } = await import(
    "../src/services/naturalLightService.js"
);

test("sends readings only for sensors in the device configuration", async () => {
    initializeDeviceState({
        deviceId: "TEST_DEVICE",
        sensors: [
            {
                sensorId: 1,
                name: "Temperature",
                type: "TEMPERATURE",
                samplingInterval: 5
            },
            {
                sensorId: 2,
                name: "Humidity",
                type: "HUMIDITY",
                samplingInterval: 5
            }
        ],
        actuators: []
    });

    const fetchSpy = jest
        .spyOn(globalThis, "fetch")
        .mockImplementation(async () => ({
            ok: true,
            status: 200,
            json: async () => ({ success: true })
        }));

    try {
        await runSimulation();

        const readingCalls = fetchSpy.mock.calls.filter(
            ([url]) => String(url).endsWith("/api/device/readings")
        );

        expect(readingCalls).toHaveLength(2);

        const sentReadings = readingCalls.map(([, options]) => {
            const body = JSON.parse(options.body);

            expect(body.deviceId).toBe("TEST_DEVICE");
            expect(body.readings).toHaveLength(1);

            return body.readings[0];
        });

        expect(
            sentReadings.map((reading) => reading.sensorId).sort()
        ).toEqual([1, 2]);

        expect(
            sentReadings.map((reading) => reading.unit).sort()
        ).toEqual(["%", "°C"]);

        expect(
            sentReadings.every(
                (reading) => typeof reading.value === "number"
            )
        ).toBe(true);
    } finally {
        fetchSpy.mockRestore();
    }
});


test("handles a device with no configured sensors", async () => {
    initializeDeviceState({
        deviceId: "TEST_DEVICE_EMPTY",
        sensors: [],
        actuators: []
    });

    const fetchSpy = jest
        .spyOn(globalThis, "fetch")
        .mockImplementation(async () => ({
            ok: true,
            status: 200,
            json: async () => ({ success: true })
        }));

    try {
        await runSimulation();

        const readingCalls = fetchSpy.mock.calls.filter(
            ([url]) => String(url).endsWith("/api/device/readings")
        );

        expect(readingCalls).toHaveLength(0);
    } finally {
        fetchSpy.mockRestore();
    }
});


function configureGrowLight(state, controlMode, sensorId = 3) {
    initializeDeviceState({
        deviceId: "TEST_DEVICE_GROW_LIGHT",
        sensors: [
            {
                sensorId,
                name: "Light",
                type: "LIGHT",
                samplingInterval: 5
            }
        ],
        actuators: [
            {
                actuatorId: 1,
                name: "Grow light",
                type: "GROW_LIGHT",
                state,
                controlMode
            }
        ]
    });
}

async function runWithMockedFetch() {
    const fetchSpy = jest
        .spyOn(globalThis, "fetch")
        .mockImplementation(async () => ({
            ok: true,
            status: 200,
            json: async () => ({ success: true })
        }));

    try {
        await runSimulation();
    } finally {
        fetchSpy.mockRestore();
    }
}

let nextGrowLightSensorId = 100;

async function runGrowLightRuleTest({
    state,
    controlMode = "AUTO",
    hour = 12,
    initialLight = 10000,
    naturalLight = 10000,
    limitReached = false
}) {
    const { default: simulationConfig } = await import(
        "../src/config/simulationConfig.js"
    );

    const originalInitialValue =
        simulationConfig.sensors.light.initialValue;


    const randomSpy = jest
        .spyOn(Math, "random")
        .mockReturnValue(0.5);

    try {
        simulationConfig.sensors.light.initialValue = initialLight;

        getSimulationTime.mockReturnValue(
            new Date(
                `2026-10-23T${String(hour).padStart(2, "0")}:00:00+02:00`
            )
        );

        configureGrowLight(
            state,
            controlMode,
            nextGrowLightSensorId++
        );

        getNaturalLight.mockReturnValue(naturalLight);

        updatePhotoperiod
            .mockReset()
            .mockResolvedValue({ limitReached });

        await runWithMockedFetch();

        return {
            state: deviceState.actuators["1"].state
        };
    } finally {
        simulationConfig.sensors.light.initialValue =
            originalInitialValue;

        randomSpy.mockRestore();
    }
}


test("passes the supplied simulation time to the photoperiod service", async () => {
    const simulationTime = new Date("2026-10-23T10:00:00.000Z");

    configureGrowLight("ON", "AUTO");

    updatePhotoperiod
        .mockReset()
        .mockResolvedValue({ limitReached: false });

    const fetchSpy = jest
        .spyOn(globalThis, "fetch")
        .mockImplementation(async () => ({
            ok: true,
            status: 200,
            json: async () => ({ success: true })
        }));

    try {
        await runSimulation(simulationTime);

        expect(updatePhotoperiod).toHaveBeenCalledWith({
            lightIsOn: true,
            now: simulationTime
        });
    } finally {
        fetchSpy.mockRestore();
    }
});


test("turns off the grow light when the daily photoperiod limit is reached", async () => {
    configureGrowLight("ON", "AUTO");

    sendDeviceStatus.mockReset();
    sendDeviceStatus.mockImplementation(async () => ({
        success: true,
        actuatorsAtSend: structuredClone(deviceState.actuators)
    }));

    updatePhotoperiod.mockReset().mockResolvedValue({
        limitReached: true
    });

    await runWithMockedFetch();

    expect(deviceState.actuators["1"].state).toBe("OFF");

    expect(updatePhotoperiod).toHaveBeenCalledWith({
        lightIsOn: true,
        now: expect.any(Date)
    });

    expect(sendDeviceStatus).toHaveBeenCalledTimes(1);

    expect(
        sendDeviceStatus.mock.results[0].value
    ).toBeInstanceOf(Promise);

    const result = await sendDeviceStatus.mock.results[0].value;

    expect(result.actuatorsAtSend["1"]).toMatchObject({
        state: "OFF",
        controlMode: "AUTO"
    });
});

test("keeps the grow light unchanged in MANUAL mode when the limit is reached", async () => {
    configureGrowLight("ON", "MANUAL");

    updatePhotoperiod.mockReset().mockResolvedValue({
        limitReached: true
    });

    await runWithMockedFetch();

    expect(deviceState.actuators["1"].state).toBe("ON");
    expect(updatePhotoperiod).toHaveBeenCalledWith({
        lightIsOn: true,
        now: expect.any(Date)
    });
});

test("turns off the grow light in AUTO mode when photoperiod status is unavailable", async () => {
    configureGrowLight("ON", "AUTO");

    updatePhotoperiod.mockReset().mockRejectedValue(
        new Error("Photoperiod state unavailable")
    );

    await runWithMockedFetch();

    expect(deviceState.actuators["1"].state).toBe("OFF");
});

test("turns on the grow light below 10000 lux in AUTO mode", async () => {
    const result = await runGrowLightRuleTest({
        state: "OFF",
        initialLight: 9998.75,
        naturalLight: 10000
    });

    expect(result.state).toBe("ON");
});

test("does not turn on the grow light at exactly 10000 lux", async () => {
    const result = await runGrowLightRuleTest({
        state: "OFF",
        initialLight: 10000,
        naturalLight: 10000
    });

    expect(result.state).toBe("OFF");
});

test("keeps the grow light on below 15000 lux in AUTO mode", async () => {
    const result = await runGrowLightRuleTest({
        state: "ON",
        initialLight: 14998.75,
        naturalLight: 10000
    });

    expect(result.state).toBe("ON");
});

test("turns off the grow light at exactly 15000 lux", async () => {
    const result = await runGrowLightRuleTest({
        state: "ON",
        initialLight: 15000,
        naturalLight: 10000
    });

    expect(result.state).toBe("OFF");
});

test("allows the grow light to turn on at 06:00", async () => {
    const result = await runGrowLightRuleTest({
        state: "OFF",
        hour: 6,
        initialLight: 9998.75,
        naturalLight: 10000
    });

    expect(result.state).toBe("ON");
});

test("allows automatic grow light rules at 19:00", async () => {
    const result = await runGrowLightRuleTest({
        state: "OFF",
        hour: 19,
        initialLight: 9998.75,
        naturalLight: 10000
    });

    expect(result.state).toBe("ON");
});

test("turns off the grow light at 20:00", async () => {
    const result = await runGrowLightRuleTest({
        state: "ON",
        hour: 20,
        initialLight: 10000,
        naturalLight: 10000
    });

    expect(result.state).toBe("OFF");
});
