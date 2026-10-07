import "dotenv/config";

import {
    initializeDeviceState,
    startCommandPolling,
    startHeartbeat
} from "./services/deviceService.js";

import { runSimulation } from "./services/simulationService.js";

async function startDevice() {
    try {
        await initializeDeviceState();

        startCommandPolling();
        startHeartbeat();

        await runSimulation();

        setInterval(() => {
            runSimulation();
        }, 5000);
    } catch (error) {
        console.error(
            "Device startup error:",
            error.message
        );
    }
}

startDevice();