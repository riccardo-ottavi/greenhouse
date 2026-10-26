
import { jest } from "@jest/globals";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import {
    createSimulationClock
} from "../src/services/simulationClock.js";

describe("simulationClock", () => {
    let temporaryDirectory;
    let statePath;
    let realTime;

    const initialTime = new Date(
        "2026-10-24T10:00:00.000Z"
    );

    beforeEach(async () => {
        temporaryDirectory = await fs.mkdtemp(
            path.join(os.tmpdir(), "simulation-clock-")
        );

        statePath = path.join(
            temporaryDirectory,
            "clock-state.json"
        );

        realTime = new Date(initialTime.getTime());
    });

    afterEach(async () => {
        jest.restoreAllMocks();

        await fs.rm(temporaryDirectory, {
            recursive: true,
            force: true
        });
    });

    function createClock(speed = 1) {
        return createSimulationClock({
            statePath,
            speed,
            nowProvider: () => new Date(realTime.getTime())
        });
    }

    test("initializes and persists the initial time", async () => {
        const clock = createClock(1);

        const time = await clock.initializeSimulationClock();

        expect(time.toISOString()).toBe(
            "2026-10-24T10:00:00.000Z"
        );

        const savedState = JSON.parse(
            await fs.readFile(statePath, "utf-8")
        );

        expect(savedState).toEqual({
            currentTime: "2026-10-24T10:00:00.000Z",
            speed: 1
        });
    });

    test("advances by elapsed real time at 1x speed", async () => {
        const clock = createClock(1);

        await clock.initializeSimulationClock();

        realTime = new Date(
            initialTime.getTime() + 5000
        );

        const nextTime =
            await clock.advanceSimulationClock();

        expect(nextTime.toISOString()).toBe(
            "2026-10-24T10:00:05.000Z"
        );

        expect(clock.getLastElapsedSimulatedMs()).toBe(0);
    });

    test("advances by twelve times elapsed real time at 12x speed", async () => {
        const clock = createClock(12);

        await clock.initializeSimulationClock();

        realTime = new Date(
            initialTime.getTime() + 5000
        );

        const nextTime =
            await clock.advanceSimulationClock();

        expect(nextTime.toISOString()).toBe(
            "2026-10-24T10:01:00.000Z"
        );

        expect(clock.getLastElapsedSimulatedMs()).toBe(0);
    });

    test("restores the saved time after restart at 12x speed", async () => {
        const firstClock = createClock(12);

        await firstClock.initializeSimulationClock();

        realTime = new Date(
            initialTime.getTime() + 5000
        );

        await firstClock.advanceSimulationClock();

        realTime = new Date(
            initialTime.getTime() + 7000
        );

        const restartedClock = createClock(12);

        const restoredTime =
            await restartedClock.initializeSimulationClock();

        expect(restoredTime.toISOString()).toBe(
            "2026-10-24T10:01:00.000Z"
        );
    });

    test("synchronizes with real time when switching to 1x speed", async () => {
        const acceleratedClock = createClock(12);

        await acceleratedClock.initializeSimulationClock();

        realTime = new Date(
            initialTime.getTime() + 5000
        );

        await acceleratedClock.advanceSimulationClock();

        realTime = new Date(
            initialTime.getTime() + 10000
        );

        const realTimeClock = createClock(1);

        const synchronizedTime =
            await realTimeClock.initializeSimulationClock();

        expect(synchronizedTime.toISOString()).toBe(
            "2026-10-24T10:00:10.000Z"
        );

        const savedState = JSON.parse(
            await fs.readFile(statePath, "utf-8")
        );

        expect(savedState.speed).toBe(1);
    });

    test("does not allow access before initialization", () => {
        const clock = createClock(1);

        expect(() => clock.getSimulationTime()).toThrow(
            "Simulation clock has not been initialized."
        );
    });

    test("rejects unsupported simulation speeds", () => {
        expect(() => createClock(3)).toThrow(
            "Invalid simulation speed: 3."
        );
    });


    test("keeps elapsed time accounted for in memory when saving fails", async () => {
        const clock = createClock(1);

        await clock.initializeSimulationClock();

        const originalRename = fs.rename;

        jest.spyOn(fs, "rename").mockImplementation(
            async (source, destination) => {
                if (destination === statePath) {
                    throw new Error("Simulated save failure");
                }

                return originalRename(source, destination);
            }
        );

        realTime = new Date(
            initialTime.getTime() + 5000
        );

        await expect(
            clock.advanceSimulationClock()
        ).rejects.toThrow("Simulated save failure");

        expect(clock.getSimulationTime().toISOString()).toBe(
            "2026-10-24T10:00:05.000Z"
        );

        expect(clock.getLastElapsedSimulatedMs()).toBe(0);

        const savedState = JSON.parse(
            await fs.readFile(statePath, "utf-8")
        );

        expect(savedState.currentTime).toBe(
            "2026-10-24T10:00:00.000Z"
        );
    });


    test("rejects invalid persisted JSON", async () => {
        await fs.writeFile(
            statePath,
            "{ invalid json",
            "utf-8"
        );

        const clock = createClock(1);

        await expect(
            clock.initializeSimulationClock()
        ).rejects.toThrow(
            "Simulation clock state contains invalid JSON."
        );
    });

    test("rejects an invalid persisted time", async () => {
        await fs.writeFile(
            statePath,
            JSON.stringify({
                currentTime: "not-a-date",
                speed: 1
            }),
            "utf-8"
        );

        const clock = createClock(1);

        await expect(
            clock.initializeSimulationClock()
        ).rejects.toThrow(
            "Simulation clock state is invalid."
        );
    });
});

describe("simulationClock migration and elapsed time", () => {
    let temporaryDirectory;
    let statePath;
    let realTime;

    const initialTime = new Date(
        "2026-10-24T10:00:00.000Z"
    );

    beforeEach(async () => {
        temporaryDirectory = await fs.mkdtemp(
            path.join(os.tmpdir(), "simulation-clock-")
        );

        statePath = path.join(
            temporaryDirectory,
            "clock-state.json"
        );

        realTime = new Date(initialTime.getTime());
    });

    afterEach(async () => {
        jest.restoreAllMocks();

        await fs.rm(temporaryDirectory, {
            recursive: true,
            force: true
        });
    });

    function createClock(speed = 1) {
        return createSimulationClock({
            statePath,
            speed,
            nowProvider: () => new Date(realTime.getTime())
        });
    }

    test("migrates the legacy state format", async () => {
        await fs.writeFile(
            statePath,
            JSON.stringify({
                currentTime: "2026-10-24T10:00:00.000Z"
            }),
            "utf-8"
        );

        const clock = createClock(12);

        const restoredTime =
            await clock.initializeSimulationClock();

        expect(restoredTime.toISOString()).toBe(
            "2026-10-24T10:00:00.000Z"
        );

        const savedState = JSON.parse(
            await fs.readFile(statePath, "utf-8")
        );

        expect(savedState).toEqual({
            currentTime: "2026-10-24T10:00:00.000Z",
            speed: 12
        });
    });

    test("reads elapsed simulated time without consuming it", async () => {
        const clock = createClock(12);

        await clock.initializeSimulationClock();

        realTime = new Date(
            initialTime.getTime() + 5000
        );

        expect(
            clock.getLastElapsedSimulatedMs()
        ).toBe(60000);

        expect(
            clock.getLastElapsedSimulatedMs()
        ).toBe(60000);
    });
});