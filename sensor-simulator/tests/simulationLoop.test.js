
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
});
