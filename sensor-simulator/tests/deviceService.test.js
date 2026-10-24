
import { afterEach, beforeEach, describe, expect, jest, test } from "@jest/globals";
import {
    initializeDeviceState
} from "../src/state/deviceState.js";

jest.unstable_mockModule(
    "../src/services/commandService.js",
    () => ({
        executeCommand: jest.fn()
    })
);

process.env.DEVICE_API_KEY ||= "test-key";

const {
    startCommandPolling,
    startHeartbeat
} = await import("../src/services/deviceService.js");

describe("deviceService intervals", () => {
    beforeEach(() => {
        jest.useFakeTimers();

        jest.spyOn(console, "log").mockImplementation(() => { });
        jest.spyOn(console, "error").mockImplementation(() => { });
    });

    afterEach(() => {
        jest.restoreAllMocks();
        jest.useRealTimers();
    });

    test("stopCommandPolling clears the polling interval", async () => {
    const clearIntervalSpy = jest.spyOn(
        globalThis,
        "clearInterval"
    );

    const fetchSpy = jest
        .spyOn(globalThis, "fetch")
        .mockResolvedValue({
            ok: true,
            json: async () => ({ success: true })
        });

    const stopCommandPolling = startCommandPolling();

    expect(jest.getTimerCount()).toBe(1);

    stopCommandPolling();

    expect(clearIntervalSpy).toHaveBeenCalledTimes(1);
    expect(jest.getTimerCount()).toBe(0);

    await jest.advanceTimersByTimeAsync(4000);

    expect(fetchSpy).not.toHaveBeenCalled();
});

test("stopHeartbeat clears the heartbeat interval", async () => {
    const clearIntervalSpy = jest.spyOn(
        globalThis,
        "clearInterval"
    );

    const fetchSpy = jest
        .spyOn(globalThis, "fetch")
        .mockResolvedValue({
            ok: true,
            json: async () => ({ success: true })
        });

    initializeDeviceState({
        deviceId: "TEST_DEVICE",
        sensors: [],
        actuators: []
    });

    const stopHeartbeat = startHeartbeat();

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(jest.getTimerCount()).toBe(1);

    stopHeartbeat();

    expect(clearIntervalSpy).toHaveBeenCalledTimes(1);
    expect(jest.getTimerCount()).toBe(0);

    await jest.advanceTimersByTimeAsync(20000);

    // No additional heartbeat should be sent after stopping.
    expect(fetchSpy).toHaveBeenCalledTimes(1);
});
});
