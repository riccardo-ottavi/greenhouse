
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEFAULT_STATE_PATH = path.resolve(
    __dirname,
    "../../data/simulation-clock-state.json"
);

export const SIMULATION_SPEEDS = [1, 12];

function validateDate(date) {
    if (
        !(date instanceof Date) ||
        !Number.isFinite(date.getTime())
    ) {
        throw new Error("A valid simulation date is required.");
    }
}

function validateSpeed(speed) {
    if (!SIMULATION_SPEEDS.includes(speed)) {
        throw new Error(
            `Invalid simulation speed: ${speed}. ` +
            "Supported speeds are 1 and 12."
        );
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

    if (
        !Number.isFinite(date.getTime()) ||
        date.toISOString() !== state.currentTime
    ) {
        return false;
    }

    if (!Object.hasOwn(state, "speed")) {
        return true;
    }

    return SIMULATION_SPEEDS.includes(state.speed);
}

async function saveState(statePath, date, speed) {
    await fs.mkdir(path.dirname(statePath), {
        recursive: true
    });

    const temporaryPath = `${statePath}.tmp`;

    await fs.writeFile(
        temporaryPath,
        JSON.stringify(
            {
                currentTime: date.toISOString(),
                speed
            },
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

    if (!Object.hasOwn(state, "speed")) {
        return {
            currentTime: state.currentTime,
            speed: 12
        };
    }

    return state;
}

export function createSimulationClock({
    statePath = DEFAULT_STATE_PATH,
    nowProvider = () => new Date(),
    speed = Number(process.env.SIMULATION_SPEED ?? 1)
} = {}) {
    validateSpeed(speed);

    let currentTime = null;
    let lastRealTime = null;

    async function initializeSimulationClock() {
        if (currentTime !== null) {
            return getSimulationTime();
        }

        const realNow = nowProvider();
        validateDate(realNow);

        const savedState = await loadState(statePath);

        const canResume =
            speed === 12 &&
            savedState !== null &&
            savedState.speed === speed;

        const initialTime = canResume
            ? new Date(savedState.currentTime)
            : new Date(realNow.getTime());

        await saveState(statePath, initialTime, speed);

        currentTime = initialTime;
        lastRealTime = new Date(realNow.getTime());

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

    async function advanceSimulationClock(
        elapsedSimulatedMs
    ) {
        if (currentTime === null || lastRealTime === null) {
            throw new Error(
                "Simulation clock has not been initialized."
            );
        }

        const realNow = nowProvider();
        validateDate(realNow);

        const elapsedRealMs = Math.max(
            0,
            realNow.getTime() - lastRealTime.getTime()
        );

        const elapsedToAdvanceMs =
            elapsedSimulatedMs === undefined
                ? elapsedRealMs * speed
                : elapsedSimulatedMs;

        if (
            !Number.isFinite(elapsedToAdvanceMs) ||
            elapsedToAdvanceMs < 0
        ) {
            throw new Error(
                "Elapsed simulated time must be a non-negative number."
            );
        }

        const elapsedRealToAdvanceMs =
            elapsedToAdvanceMs / speed;

        const nextTime = new Date(
            currentTime.getTime() + elapsedToAdvanceMs
        );

        currentTime = nextTime;

        lastRealTime = new Date(
            lastRealTime.getTime() + elapsedRealToAdvanceMs
        );

        await saveState(statePath, nextTime, speed);

        return getSimulationTime();
    }

    function getLastElapsedSimulatedMs() {
        if (currentTime === null || lastRealTime === null) {
            throw new Error(
                "Simulation clock has not been initialized."
            );
        }

        const realNow = nowProvider();
        validateDate(realNow);

        const elapsedRealMs = Math.max(
            0,
            realNow.getTime() - lastRealTime.getTime()
        );

        return elapsedRealMs * speed;
    }

    return {
        initializeSimulationClock,
        getSimulationTime,
        advanceSimulationClock,
        getLastElapsedSimulatedMs
    };
}

const defaultClock = createSimulationClock();

export const initializeSimulationClock =
    defaultClock.initializeSimulationClock;

export const getSimulationTime =
    defaultClock.getSimulationTime;

export const advanceSimulationClock =
    defaultClock.advanceSimulationClock;

export const getLastElapsedSimulatedMs =
    defaultClock.getLastElapsedSimulatedMs;