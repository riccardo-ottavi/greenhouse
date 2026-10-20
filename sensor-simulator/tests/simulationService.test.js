
import { test, jest, expect } from "@jest/globals";
import deviceState, {
    initializeDeviceState
} from "../src/state/deviceState.js";

jest.unstable_mockModule(
    "../src/services/deviceService.js",
    () => ({
        BACKEND_URL: "http://localhost:3000",
        DEVICE_HEADERS: {
            "Content-Type": "application/json",
            "X-API-Key": "test-key"
        },
        sendDeviceStatus: jest.fn().mockResolvedValue({ success: true }),
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

const { runSimulation } = await import(
    "../src/services/simulationService.js"
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
