import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import {
    createSimulationClock
} from "../src/services/simulationClock.js";
import { describe, expect, jest, test } from "@jest/globals";

import {
    runSimulationCycle
} from "../src/services/simulationLoop.js";

describe("simulationLoop", () => {
    test("runs the simulation before advancing the clock", async () => {
        const simulationTime = new Date(
            "2026-10-24T10:00:00.000Z"
        );

        const events = [];

        const runSimulation = jest.fn(async (time) => {
            events.push("simulation");

            expect(time).toBe(simulationTime);
        });

        const getSimulationTime = jest.fn(() => simulationTime);

        const advanceSimulationClock = jest.fn(async () => {
            events.push("advance");
        });

        await runSimulationCycle({
            runSimulation,
            getSimulationTime,
            advanceSimulationClock
        });

        expect(events).toEqual(["simulation", "advance"]);
        expect(getSimulationTime).toHaveBeenCalledTimes(1);
        expect(runSimulation).toHaveBeenCalledTimes(1);
        expect(advanceSimulationClock).toHaveBeenCalledTimes(1);
    });

    test("does not advance the clock when the simulation fails", async () => {
        const logger = {
            error: jest.fn()
        };

        const runSimulation = jest.fn(async () => {
            throw new Error("Simulation failed");
        });

        const advanceSimulationClock = jest.fn();

        await runSimulationCycle({
            runSimulation,
            getSimulationTime: () => new Date(
                "2026-10-24T10:00:00.000Z"
            ),
            advanceSimulationClock,
            logger
        });

        expect(advanceSimulationClock).not.toHaveBeenCalled();

        expect(logger.error).toHaveBeenCalledWith(
            "Simulation cycle error:",
            "Simulation failed"
        );
    });

    test("propagates clock errors instead of swallowing them", async () => {
        const clockError = new Error("Persistence failed");

        await expect(
            runSimulationCycle({
                runSimulation: jest.fn().mockResolvedValue(undefined),
                getSimulationTime: () => new Date(
                    "2026-10-24T10:00:00.000Z"
                ),
                advanceSimulationClock: jest.fn().mockRejectedValue(
                    clockError
                )
            })
        ).rejects.toBe(clockError);
    });
    test("does not advance the clock when simulation fails", async () => {
        const runSimulation = jest.fn().mockRejectedValue(
            new Error("Simulated failure")
        );
        const getSimulationTime = jest.fn(
            () => new Date("2026-10-24T10:00:00.000Z")
        );
        const advanceSimulationClock = jest.fn();
        const getLastElapsedSimulatedMs = jest.fn(
            () => 60000
        );
        const logger = {
            error: jest.fn()
        };

        await runSimulationCycle({
            runSimulation,
            getSimulationTime,
            advanceSimulationClock,
            getLastElapsedSimulatedMs,
            logger
        });

        expect(runSimulation).toHaveBeenCalledWith(
            new Date("2026-10-24T10:00:00.000Z"),
            60000
        );
        expect(advanceSimulationClock).not.toHaveBeenCalled();
        expect(getLastElapsedSimulatedMs).toHaveBeenCalledTimes(1);
        expect(logger.error).toHaveBeenCalledWith(
            "Simulation cycle error:",
            "Simulated failure"
        );
    });

    test("does not reuse elapsed time after a failed cycle", async () => {
        const runSimulation = jest.fn()
            .mockRejectedValueOnce(new Error("Simulated failure"))
            .mockResolvedValueOnce(undefined);

        const getSimulationTime = jest.fn(
            () => new Date("2026-10-24T10:00:00.000Z")
        );
        const advanceSimulationClock = jest.fn();
        const getLastElapsedSimulatedMs = jest.fn()
            .mockReturnValueOnce(60000)
            .mockReturnValueOnce(0);

        const logger = {
            error: jest.fn()
        };

        const dependencies = {
            runSimulation,
            getSimulationTime,
            advanceSimulationClock,
            getLastElapsedSimulatedMs,
            logger
        };

        await runSimulationCycle(dependencies);
        await runSimulationCycle(dependencies);

        expect(runSimulation).toHaveBeenNthCalledWith(
            1,
            expect.any(Date),
            60000
        );
        expect(runSimulation).toHaveBeenNthCalledWith(
            2,
            expect.any(Date),
            0
        );
        expect(advanceSimulationClock).toHaveBeenCalledTimes(1);
    });
});

test("recovers elapsed time after a failed cycle without double-counting", async () => {
    const temporaryDirectory = await fs.mkdtemp(
        path.join(os.tmpdir(), "simulation-loop-")
    );

    try {
        const statePath = path.join(
            temporaryDirectory,
            "clock-state.json"
        );

        const initialTime = new Date(
            "2026-10-24T10:00:00.000Z"
        );

        let realTime = new Date(initialTime);

        const clock = createSimulationClock({
            statePath,
            speed: 1,
            nowProvider: () => new Date(realTime)
        });

        await clock.initializeSimulationClock();

        const logger = {
            error: jest.fn()
        };

        const runSimulation = jest.fn()
            .mockRejectedValueOnce(
                new Error("Simulated failure")
            )
            .mockResolvedValueOnce(undefined);

        const dependencies = {
            runSimulation,
            getSimulationTime: clock.getSimulationTime,
            advanceSimulationClock: clock.advanceSimulationClock,
            getLastElapsedSimulatedMs:
                clock.getLastElapsedSimulatedMs,
            logger
        };

        realTime = new Date(
            initialTime.getTime() + 5000
        );

        await runSimulationCycle(dependencies);

        expect(runSimulation).toHaveBeenNthCalledWith(
            1,
            initialTime,
            5000
        );

        expect(clock.getSimulationTime().toISOString()).toBe(
            "2026-10-24T10:00:00.000Z"
        );

        realTime = new Date(
            initialTime.getTime() + 10000
        );

        await runSimulationCycle(dependencies);

        expect(runSimulation).toHaveBeenNthCalledWith(
            2,
            initialTime,
            10000
        );

        expect(clock.getSimulationTime().toISOString()).toBe(
            "2026-10-24T10:00:10.000Z"
        );

        expect(clock.getLastElapsedSimulatedMs()).toBe(0);

        expect(logger.error).toHaveBeenCalledWith(
            "Simulation cycle error:",
            "Simulated failure"
        );
    } finally {
        await fs.rm(temporaryDirectory, {
            recursive: true,
            force: true
        });
    }
});

test("recovers elapsed time correctly at simulation speed 12", async () => {
    const temporaryDirectory = await fs.mkdtemp(
        path.join(os.tmpdir(), "simulation-loop-")
    );

    try {
        const statePath = path.join(
            temporaryDirectory,
            "clock-state.json"
        );

        const initialTime = new Date(
            "2026-10-24T10:00:00.000Z"
        );

        let realTime = new Date(initialTime);

        const clock = createSimulationClock({
            statePath,
            speed: 12,
            nowProvider: () => new Date(realTime)
        });

        await clock.initializeSimulationClock();

        const runSimulation = jest.fn()
            .mockRejectedValueOnce(
                new Error("Simulated failure")
            )
            .mockResolvedValueOnce(undefined);

        const dependencies = {
            runSimulation,
            getSimulationTime: clock.getSimulationTime,
            advanceSimulationClock: clock.advanceSimulationClock,
            getLastElapsedSimulatedMs:
                clock.getLastElapsedSimulatedMs,
            logger: {
                error: jest.fn()
            }
        };

        realTime = new Date(
            initialTime.getTime() + 5000
        );

        await runSimulationCycle(dependencies);

        expect(clock.getSimulationTime().toISOString()).toBe(
            "2026-10-24T10:00:00.000Z"
        );

        realTime = new Date(
            initialTime.getTime() + 10000
        );

        await runSimulationCycle(dependencies);

        expect(runSimulation).toHaveBeenNthCalledWith(
            1,
            initialTime,
            60000
        );

        expect(runSimulation).toHaveBeenNthCalledWith(
            2,
            initialTime,
            120000
        );

        expect(clock.getSimulationTime().toISOString()).toBe(
            "2026-10-24T10:02:00.000Z"
        );

        expect(clock.getLastElapsedSimulatedMs()).toBe(0);
    } finally {
        await fs.rm(temporaryDirectory, {
            recursive: true,
            force: true
        });
    }
});


test("reports a clock-save failure after a successful simulation", async () => {
    const runSimulation = jest.fn().mockResolvedValue(undefined);
    const getSimulationTime = jest.fn(
        () => new Date("2026-10-24T10:00:00.000Z")
    );
    const advanceSimulationClock = jest.fn().mockRejectedValue(
        new Error("Simulated clock-save failure")
    );
    const getLastElapsedSimulatedMs = jest.fn(() => 5000);
    const logger = {
        error: jest.fn()
    };

    await expect(
        runSimulationCycle({
            runSimulation,
            getSimulationTime,
            advanceSimulationClock,
            getLastElapsedSimulatedMs,
            logger
        })
    ).rejects.toThrow("Simulated clock-save failure");

    expect(runSimulation).toHaveBeenCalledWith(
        new Date("2026-10-24T10:00:00.000Z"),
        5000
    );

    expect(advanceSimulationClock).toHaveBeenCalledWith(5000);
});


test("does not double-count elapsed time when saving the clock fails after a successful simulation", async () => {
    const temporaryDirectory = await fs.mkdtemp(
        path.join(os.tmpdir(), "simulation-loop-")
    );

    const originalRename = fs.rename;

    try {
        const statePath = path.join(
            temporaryDirectory,
            "clock-state.json"
        );

        const initialTime = new Date(
            "2026-10-24T10:00:00.000Z"
        );

        let realTime = new Date(initialTime);
        let shouldFailSave = true;

        const clock = createSimulationClock({
            statePath,
            speed: 1,
            nowProvider: () => new Date(realTime)
        });

        await clock.initializeSimulationClock();

        jest.spyOn(fs, "rename").mockImplementation(
            async (source, destination) => {
                if (
                    destination === statePath &&
                    shouldFailSave
                ) {
                    shouldFailSave = false;
                    throw new Error("Simulated clock-save failure");
                }

                return originalRename(source, destination);
            }
        );

        const runSimulation = jest.fn().mockResolvedValue(undefined);
        const logger = {
            error: jest.fn()
        };

        const dependencies = {
            runSimulation,
            getSimulationTime: clock.getSimulationTime,
            advanceSimulationClock: clock.advanceSimulationClock,
            getLastElapsedSimulatedMs:
                clock.getLastElapsedSimulatedMs,
            logger
        };

        realTime = new Date(
            initialTime.getTime() + 5000
        );

        await expect(
            runSimulationCycle(dependencies)
        ).rejects.toThrow("Simulated clock-save failure");

        expect(runSimulation).toHaveBeenNthCalledWith(
            1,
            initialTime,
            5000
        );

        expect(clock.getSimulationTime().toISOString()).toBe(
            "2026-10-24T10:00:05.000Z"
        );

        realTime = new Date(
            initialTime.getTime() + 10000
        );

        await runSimulationCycle(dependencies);

        expect(runSimulation).toHaveBeenNthCalledWith(
            2,
            new Date("2026-10-24T10:00:05.000Z"),
            5000
        );

        expect(clock.getSimulationTime().toISOString()).toBe(
            "2026-10-24T10:00:10.000Z"
        );

        expect(clock.getLastElapsedSimulatedMs()).toBe(0);

        // The second save should succeed and persist the updated clock.
        const savedState = JSON.parse(
            await fs.readFile(statePath, "utf-8")
        );

        expect(savedState.currentTime).toBe(
            "2026-10-24T10:00:10.000Z"
        );
    } finally {
        jest.restoreAllMocks();

        await fs.rm(temporaryDirectory, {
            recursive: true,
            force: true
        });
    }
});
