
import {
    afterEach,
    beforeEach,
    test,
    expect
} from "@jest/globals";

import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import {
    createPhotoperiodService,
    MAX_DAILY_SECONDS
} from "../src/services/photoperiodService.js";

let temporaryDirectory;
let statePath;

beforeEach(async () => {
    temporaryDirectory = await fs.mkdtemp(
        path.join(os.tmpdir(), "photoperiod-test-")
    );

    statePath = path.join(
        temporaryDirectory,
        "photoperiod-state.json"
    );
});

afterEach(async () => {
    await fs.rm(temporaryDirectory, {
        recursive: true,
        force: true
    });
});

function createService() {
    return createPhotoperiodService({ statePath });
}

function addSeconds(date, seconds) {
    return new Date(date.getTime() + seconds * 1000);
}

test("accumulates time while the light is on, but not while it is off", async () => {
    const service = createService();
    const start = new Date(2026, 0, 15, 10, 0, 0);

    await service.updatePhotoperiod({
        lightIsOn: true,
        now: start
    });

    const afterThirtySeconds = await service.updatePhotoperiod({
        lightIsOn: true,
        now: addSeconds(start, 30)
    });

    expect(afterThirtySeconds.accumulatedSeconds).toBe(30);

    const afterFiftySeconds = await service.updatePhotoperiod({
        lightIsOn: false,
        now: addSeconds(start, 50)
    });

    expect(afterFiftySeconds.accumulatedSeconds).toBe(50);

    const afterOneHundredSeconds = await service.updatePhotoperiod({
        lightIsOn: false,
        now: addSeconds(start, 100)
    });

    expect(afterOneHundredSeconds.accumulatedSeconds).toBe(50);
});

test("does not count time elapsed while the simulator was stopped", async () => {
    const start = new Date(2026, 0, 15, 10, 0, 0);
    const firstSession = createService();

    await firstSession.updatePhotoperiod({
        lightIsOn: true,
        now: start
    });

    const beforeRestart = await firstSession.updatePhotoperiod({
        lightIsOn: true,
        now: addSeconds(start, 60)
    });

    expect(beforeRestart.accumulatedSeconds).toBe(60);

    const restartedSession = createService();

    const afterRestart = await restartedSession.updatePhotoperiod({
        lightIsOn: true,
        now: addSeconds(start, 3600)
    });

    expect(afterRestart.accumulatedSeconds).toBe(60);

    const tenSecondsLater = await restartedSession.updatePhotoperiod({
        lightIsOn: true,
        now: addSeconds(start, 3610)
    });

    expect(tenSecondsLater.accumulatedSeconds).toBe(70);
});

test("resets the accumulated time when the local calendar day changes", async () => {
    const service = createService();
    const beforeMidnight = new Date(2026, 0, 15, 23, 59, 30);

    await service.updatePhotoperiod({
        lightIsOn: true,
        now: beforeMidnight
    });

    const beforeDayChange = await service.updatePhotoperiod({
        lightIsOn: true,
        now: addSeconds(beforeMidnight, 20)
    });

    expect(beforeDayChange.accumulatedSeconds).toBe(20);

    const afterMidnight = new Date(2026, 0, 16, 0, 0, 10);

    const nextDay = await service.updatePhotoperiod({
        lightIsOn: true,
        now: afterMidnight
    });

    expect(nextDay.date).toBe("2026-01-16");
    expect(nextDay.accumulatedSeconds).toBe(10);
    expect(nextDay.remainingSeconds).toBe(MAX_DAILY_SECONDS - 10);
    expect(nextDay.limitReached).toBe(false);
});

test("counts only the new day's time when the first update is after midnight", async () => {
    const service = createService();
    const beforeMidnight = new Date(2026, 0, 15, 23, 59, 0);

    await service.updatePhotoperiod({
        lightIsOn: true,
        now: beforeMidnight
    });

    const afterMidnight = new Date(2026, 0, 16, 0, 5, 0);

    const nextDay = await service.updatePhotoperiod({
        lightIsOn: true,
        now: afterMidnight
    });

    expect(nextDay.date).toBe("2026-01-16");
    expect(nextDay.accumulatedSeconds).toBe(300);
    expect(nextDay.remainingSeconds).toBe(MAX_DAILY_SECONDS - 300);
    expect(nextDay.limitReached).toBe(false);
});

test("does not count the previous day after a status check at midnight", async () => {
    const service = createService();
    const beforeMidnight = new Date(2026, 0, 15, 23, 59, 0);

    await service.updatePhotoperiod({
        lightIsOn: true,
        now: beforeMidnight
    });

    const atMidnight = new Date(2026, 0, 16, 0, 0, 0);

    await service.getPhotoperiodStatus(atMidnight);

    const fiveMinutesLater = new Date(2026, 0, 16, 0, 5, 0);

    const status = await service.updatePhotoperiod({
        lightIsOn: true,
        now: fiveMinutesLater
    });

    expect(status.date).toBe("2026-01-16");
    expect(status.accumulatedSeconds).toBe(300);
    expect(status.remainingSeconds).toBe(MAX_DAILY_SECONDS - 300);
    expect(status.limitReached).toBe(false);
});

test("caps the accumulated time at twelve hours", async () => {
    const service = createService();
    const start = new Date(2026, 0, 15, 8, 0, 0);

    await service.updatePhotoperiod({
        lightIsOn: true,
        now: start
    });

    const status = await service.updatePhotoperiod({
        lightIsOn: true,
        now: addSeconds(start, MAX_DAILY_SECONDS + 120)
    });

    expect(status.accumulatedSeconds).toBe(MAX_DAILY_SECONDS);
    expect(status.remainingSeconds).toBe(0);
    expect(status.limitReached).toBe(true);
});

test("fails explicitly when the persisted state contains invalid JSON", async () => {
    await fs.writeFile(statePath, "{ invalid json", "utf-8");

    const service = createService();

    await expect(
        service.updatePhotoperiod({
            lightIsOn: true,
            now: new Date(2026, 0, 15, 10, 0, 0)
        })
    ).rejects.toThrow("Photoperiod state file contains invalid JSON");
});

test("initializes a missing state file with zero accumulated time", async () => {
    const service = createService();

    const status = await service.updatePhotoperiod({
        lightIsOn: false,
        now: new Date(2026, 0, 15, 10, 0, 0)
    });

    expect(status.accumulatedSeconds).toBe(0);
    expect(status.remainingSeconds).toBe(MAX_DAILY_SECONDS);
    expect(status.limitReached).toBe(false);

    await expect(fs.access(statePath)).resolves.toBeUndefined();
});


test("accumulates multiple separate periods when the light is on", async () => {
    const service = createService();
    const start = new Date(2026, 0, 15, 10, 0, 0);

    await service.updatePhotoperiod({
        lightIsOn: true,
        now: start
    });

    await service.updatePhotoperiod({
        lightIsOn: true,
        now: addSeconds(start, 30)
    });

    const firstOff = await service.updatePhotoperiod({
        lightIsOn: false,
        now: addSeconds(start, 50)
    });

    expect(firstOff.accumulatedSeconds).toBe(50);

    const stillOff = await service.updatePhotoperiod({
        lightIsOn: false,
        now: addSeconds(start, 100)
    });

    expect(stillOff.accumulatedSeconds).toBe(50);

    await service.updatePhotoperiod({
        lightIsOn: true,
        now: addSeconds(start, 150)
    });

    const secondOn = await service.updatePhotoperiod({
        lightIsOn: true,
        now: addSeconds(start, 180)
    });

    expect(secondOn.accumulatedSeconds).toBe(80);

    const secondOff = await service.updatePhotoperiod({
        lightIsOn: false,
        now: addSeconds(start, 200)
    });

    expect(secondOff.accumulatedSeconds).toBe(100);
});

test("reaches twelve hours across separate ON periods", async () => {
    const service = createService();
    const start = new Date(2026, 0, 15, 8, 0, 0);

    await service.updatePhotoperiod({
        lightIsOn: true,
        now: start
    });

    const beforeLimit = await service.updatePhotoperiod({
        lightIsOn: true,
        now: addSeconds(start, MAX_DAILY_SECONDS - 60)
    });

    expect(beforeLimit.accumulatedSeconds).toBe(
        MAX_DAILY_SECONDS - 60
    );
    expect(beforeLimit.limitReached).toBe(false);

    const almostThere = await service.updatePhotoperiod({
        lightIsOn: false,
        now: addSeconds(start, MAX_DAILY_SECONDS - 30)
    });

    expect(almostThere.accumulatedSeconds).toBe(
        MAX_DAILY_SECONDS - 30
    );

    const afterOffPeriod = await service.updatePhotoperiod({
        lightIsOn: true,
        now: addSeconds(start, MAX_DAILY_SECONDS + 30)
    });

    expect(afterOffPeriod.accumulatedSeconds).toBe(
        MAX_DAILY_SECONDS - 30
    );
    expect(afterOffPeriod.limitReached).toBe(false);

    const atLimit = await service.updatePhotoperiod({
        lightIsOn: true,
        now: addSeconds(start, MAX_DAILY_SECONDS + 60)
    });

    expect(atLimit.accumulatedSeconds).toBe(MAX_DAILY_SECONDS);
    expect(atLimit.remainingSeconds).toBe(0);
    expect(atLimit.limitReached).toBe(true);
});