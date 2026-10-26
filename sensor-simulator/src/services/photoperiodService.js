import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import simulationConfig from "../config/simulationConfig.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEFAULT_STATE_PATH = path.resolve(
    __dirname,
    "../../data/photoperiod-state.json"
);

const DEFAULT_TIME_ZONE = simulationConfig.location.timezone;

export const MAX_DAILY_SECONDS = 12 * 60 * 60;

function getLocalDateTimeParts(date, timeZone) {
    const parts = new Intl.DateTimeFormat("en-GB", {
        timeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hourCycle: "h23"
    }).formatToParts(date);

    return Object.fromEntries(
        parts.map(({ type, value }) => [type, value])
    );
}

function getLocalDateKey(date = new Date(), timeZone) {
    const parts = getLocalDateTimeParts(date, timeZone);

    return `${parts.year}-${parts.month}-${parts.day}`;
}

function getLocalMidnightTimestamp(date, timeZone) {
    const parts = getLocalDateTimeParts(date, timeZone);

    const targetTimestamp = Date.UTC(
        Number(parts.year),
        Number(parts.month) - 1,
        Number(parts.day),
        0,
        0,
        0
    );

    let timestamp = targetTimestamp;

    for (let attempt = 0; attempt < 3; attempt += 1) {
        const localParts = getLocalDateTimeParts(
            new Date(timestamp),
            timeZone
        );

        const localTimestamp = Date.UTC(
            Number(localParts.year),
            Number(localParts.month) - 1,
            Number(localParts.day),
            Number(localParts.hour),
            Number(localParts.minute),
            Number(localParts.second)
        );

        const difference = localTimestamp - targetTimestamp;

        if (difference === 0) {
            break;
        }

        timestamp -= difference;
    }

    return timestamp;
}

function createInitialState(date = new Date(), timeZone) {
    return {
        date: getLocalDateKey(date, timeZone),
        accumulatedSeconds: 0,
        lastAccountedAt: null,
        lastObservedLightIsOn: false
    };
}

function isValidDateKey(value) {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return false;
    }

    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));

    return (
        date.getUTCFullYear() === year &&
        date.getUTCMonth() === month - 1 &&
        date.getUTCDate() === day
    );
}

function isValidState(state) {
    return (
        state !== null &&
        typeof state === "object" &&
        !Array.isArray(state) &&
        isValidDateKey(state.date) &&
        Number.isFinite(state.accumulatedSeconds) &&
        state.accumulatedSeconds >= 0 &&
        state.accumulatedSeconds <= MAX_DAILY_SECONDS &&
        typeof state.lastObservedLightIsOn === "boolean" &&
        (
            state.lastAccountedAt === null ||
            (
                Number.isFinite(state.lastAccountedAt) &&
                state.lastAccountedAt >= 0
            )
        )
    );
}

function validateNow(now) {
    if (!(now instanceof Date) || !Number.isFinite(now.getTime())) {
        throw new Error("A valid date is required.");
    }
}

async function saveState(state, statePath) {
    await fs.mkdir(path.dirname(statePath), {
        recursive: true
    });

    const temporaryPath = `${statePath}.tmp`;

    await fs.writeFile(
        temporaryPath,
        JSON.stringify(state, null, 4),
        "utf-8"
    );

    await fs.rename(temporaryPath, statePath);
}

async function loadState(statePath, now, timeZone) {
    let content;

    try {
        content = await fs.readFile(statePath, "utf-8");
    } catch (error) {
        if (error.code !== "ENOENT") {
            throw error;
        }

        const initialState = createInitialState(now, timeZone);
        await saveState(initialState, statePath);

        return initialState;
    }

    let state;

    try {
        state = JSON.parse(content);
    } catch {
        throw new Error(
            "Photoperiod state file contains invalid JSON. " +
            "Manual recovery is required."
        );
    }

    if (!isValidState(state)) {
        throw new Error(
            "Photoperiod state file is invalid. " +
            "Manual recovery is required."
        );
    }

    return state;
}

function resetIfNewDay(state, now, timeZone) {
    const currentDate = getLocalDateKey(now, timeZone);

    if (state.date !== currentDate) {
        state.date = currentDate;
        state.accumulatedSeconds = 0;
        return true;
    }

    return false;
}

function accountElapsedTime(state, now, lightIsOn) {
    const nowMs = now.getTime();

    if (
        state.lastAccountedAt !== null &&
        state.lastObservedLightIsOn
    ) {
        const elapsedSeconds = Math.max(
            0,
            (nowMs - state.lastAccountedAt) / 1000
        );

        state.accumulatedSeconds = Math.min(
            MAX_DAILY_SECONDS,
            state.accumulatedSeconds + elapsedSeconds
        );
    }

    state.lastAccountedAt = nowMs;
    state.lastObservedLightIsOn = lightIsOn;

    return state;
}

function buildStatus(state) {
    return {
        ...state,
        remainingSeconds: Math.max(
            0,
            MAX_DAILY_SECONDS - state.accumulatedSeconds
        ),
        limitReached:
            state.accumulatedSeconds >= MAX_DAILY_SECONDS
    };
}

export function createPhotoperiodService({
    statePath = DEFAULT_STATE_PATH,
    timeZone = DEFAULT_TIME_ZONE
} = {}) {
    let sessionInitialized = false;

    async function updatePhotoperiod({
        lightIsOn,
        now = new Date()
    }) {
        validateNow(now);

        if (typeof lightIsOn !== "boolean") {
            throw new Error("lightIsOn must be a boolean.");
        }

        const state = await loadState(statePath, now, timeZone);
        const dayChanged = resetIfNewDay(state, now, timeZone);

        if (!sessionInitialized) {
            state.lastAccountedAt = now.getTime();
            state.lastObservedLightIsOn = lightIsOn;

            sessionInitialized = true;
        } else if (dayChanged) {
            const midnight = getLocalMidnightTimestamp(now, timeZone);

            const previouslyOn = state.lastObservedLightIsOn;

            state.lastAccountedAt = previouslyOn
                ? midnight
                : now.getTime();

            state.lastObservedLightIsOn = previouslyOn;

            accountElapsedTime(state, now, lightIsOn);
        } else {
            accountElapsedTime(state, now, lightIsOn);
        }

        await saveState(state, statePath);

        return buildStatus(state);
    }


    async function getPhotoperiodStatus(now = new Date()) {
        validateNow(now);

        const state = await loadState(statePath, now, timeZone);
        const dayChanged = resetIfNewDay(state, now, timeZone);

        if (dayChanged) {
            state.lastAccountedAt = now.getTime();
        }

        await saveState(state, statePath);

        return buildStatus(state);
    }


    return {
        updatePhotoperiod,
        getPhotoperiodStatus
    };
}

const defaultService = createPhotoperiodService();

export const updatePhotoperiod = defaultService.updatePhotoperiod;
export const getPhotoperiodStatus = defaultService.getPhotoperiodStatus;
