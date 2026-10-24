
import "dotenv/config";

import {
    initializeDeviceState,
    startCommandPolling,
    startHeartbeat
} from "./services/deviceService.js";

import { runSimulation } from "./services/simulationService.js";
import { runSimulationCycle } from "./services/simulationLoop.js";

import {
    initializeSimulationClock,
    getSimulationTime,
    advanceSimulationClock
} from "./services/simulationClock.js";

const SIMULATION_INTERVAL_MS = 5000;

function wait(milliseconds) {
    return new Promise((resolve) => {
        setTimeout(resolve, milliseconds);
    });
}

async function startDevice() {
    try {
        await initializeDeviceState();
        await initializeSimulationClock();

        const stopCommandPolling = startCommandPolling();
        const stopHeartbeat = startHeartbeat();

        while (true) {
            try {
                await runSimulationCycle({
                    runSimulation,
                    getSimulationTime,
                    advanceSimulationClock
                });
            } catch (error) {
                console.error(
                    "Simulation clock error. Stopping simulation loop:",
                    error.message
                );

                stopCommandPolling();
                stopHeartbeat();

                break;
            }

            await wait(SIMULATION_INTERVAL_MS);
        }
    } catch (error) {
        console.error(
            "Device startup error:",
            error.message
        );
    }
}

startDevice();
