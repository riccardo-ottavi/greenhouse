
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEFAULT_STATE_PATH = path.resolve(
    __dirname,
    "../../data/simulation-clock-state.json"
);

export const SIMULATED_MINUTE_MS = 60 * 1000;

function validateDate(date) {
    if (
        !(date instanceof Date) ||
        !Number.isFinite(date.getTime())
    ) {
        throw new Error("A valid simulation date is required.");
    }
}

function isValidState(state) {
    if (
        state === null ||
        typeof state !== "object" ||
        Array.isArray(state) ||
        typeof state.currentTime !== "string"
    ) {
        return false;
    }

    const date = new Date(state.currentTime);

    return (
        Number.isFinite(date.getTime()) &&
        date.toISOString() === state.currentTime
    );
}

async function saveState(statePath, date) {
    await fs.mkdir(path.dirname(statePath), {
        recursive: true
    });

    const temporaryPath = `${statePath}.tmp`;

    await fs.writeFile(
        temporaryPath,
        JSON.stringify(
            { currentTime: date.toISOString() },
            null,
            4
        ),
        "utf-8"
    );

    await fs.rename(temporaryPath, statePath);
}

async function loadState(statePath) {
    let content;

    try {
        content = await fs.readFile(statePath, "utf-8");
    } catch (error) {
        if (error.code === "ENOENT") {
            return null;
        }

        throw error;
    }

    let state;

    try {
        state = JSON.parse(content);
    } catch {
        throw new Error(
            "Simulation clock state contains invalid JSON. " +
            "Manual recovery is required."
        );
    }

    if (!isValidState(state)) {
        throw new Error(
            "Simulation clock state is invalid. " +
            "Manual recovery is required."
        );
    }

    return new Date(state.currentTime);
}

export function createSimulationClock({
    statePath = DEFAULT_STATE_PATH,
    nowProvider = () => new Date()
} = {}) {
    let currentTime = null;

    async function initializeSimulationClock() {
        if (currentTime !== null) {
            return getSimulationTime();
        }

        const savedTime = await loadState(statePath);

        if (savedTime !== null) {
            currentTime = savedTime;
            return getSimulationTime();
        }

        const initialTime = nowProvider();
        validateDate(initialTime);

        await saveState(statePath, initialTime);
        currentTime = new Date(initialTime.getTime());

        return getSimulationTime();
    }

    function getSimulationTime() {
        if (currentTime === null) {
            throw new Error(
                "Simulation clock has not been initialized."
            );
        }

        return new Date(currentTime.getTime());
    }

    async function advanceSimulationClock() {
        if (currentTime === null) {
            throw new Error(
                "Simulation clock has not been initialized."
            );
        }

        const nextTime = new Date(
            currentTime.getTime() + SIMULATED_MINUTE_MS
        );

        await saveState(statePath, nextTime);
        currentTime = nextTime;

        return getSimulationTime();
    }

    return {
        initializeSimulationClock,
        getSimulationTime,
        advanceSimulationClock
    };
}

const defaultClock = createSimulationClock();

export const initializeSimulationClock =
    defaultClock.initializeSimulationClock;

export const getSimulationTime =
    defaultClock.getSimulationTime;

export const advanceSimulationClock =
    defaultClock.advanceSimulationClock;
