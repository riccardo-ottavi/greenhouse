
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
    });

    afterEach(async () => {
        await fs.rm(temporaryDirectory, {
            recursive: true,
            force: true
        });
    });

    test("initializes and persists the initial time", async () => {
        const clock = createSimulationClock({
            statePath,
            nowProvider: () => initialTime
        });

        const time = await clock.initializeSimulationClock();

        expect(time.toISOString()).toBe(
            "2026-10-24T10:00:00.000Z"
        );

        const savedState = JSON.parse(
            await fs.readFile(statePath, "utf-8")
        );

        expect(savedState.currentTime).toBe(
            "2026-10-24T10:00:00.000Z"
        );
    });

    test("advances exactly one simulated minute", async () => {
        const clock = createSimulationClock({
            statePath,
            nowProvider: () => initialTime
        });

        await clock.initializeSimulationClock();

        const nextTime =
            await clock.advanceSimulationClock();

        expect(nextTime.toISOString()).toBe(
            "2026-10-24T10:01:00.000Z"
        );
    });

    test("restores the last saved time after restart", async () => {
        const firstClock = createSimulationClock({
            statePath,
            nowProvider: () => initialTime
        });

        await firstClock.initializeSimulationClock();
        await firstClock.advanceSimulationClock();

        const restartedClock = createSimulationClock({
            statePath,
            nowProvider: () => new Date(
                "2030-01-01T00:00:00.000Z"
            )
        });

        const restoredTime =
            await restartedClock.initializeSimulationClock();

        expect(restoredTime.toISOString()).toBe(
            "2026-10-24T10:01:00.000Z"
        );
    });

    test("does not allow access before initialization", () => {
        const clock = createSimulationClock({
            statePath,
            nowProvider: () => initialTime
        });

        expect(() => clock.getSimulationTime()).toThrow(
            "Simulation clock has not been initialized."
        );
    });

    

test("keeps the current time unchanged when saving the next time fails", async () => {
    const clock = createSimulationClock({
        statePath,
        nowProvider: () => initialTime
    });

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

    try {
        await expect(
            clock.advanceSimulationClock()
        ).rejects.toThrow("Simulated save failure");

        expect(clock.getSimulationTime().toISOString()).toBe(
            "2026-10-24T10:00:00.000Z"
        );

        const savedState = JSON.parse(
            await fs.readFile(statePath, "utf-8")
        );

        expect(savedState.currentTime).toBe(
            "2026-10-24T10:00:00.000Z"
        );
    } finally {
        jest.restoreAllMocks();
    }
});



    test("rejects invalid persisted JSON", async () => {
        await fs.writeFile(statePath, "{ invalid json", "utf-8");

        const clock = createSimulationClock({
            statePath,
            nowProvider: () => initialTime
        });

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
                currentTime: "not-a-date"
            }),
            "utf-8"
        );

        const clock = createSimulationClock({
            statePath,
            nowProvider: () => initialTime
        });

        await expect(
            clock.initializeSimulationClock()
        ).rejects.toThrow(
            "Simulation clock state is invalid."
        );
    });
});
