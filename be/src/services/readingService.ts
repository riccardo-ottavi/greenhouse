import { db } from "../database/connection.js";

import {
  DeviceReadingInput,
  Reading,
  ReadingInput,
  ReadingUnit,
  ReadingRange,
  ReadingHistoryPage,
  ReadingAggregate
} from "../types/Reading.js";

import { AppError } from "../errors/AppError.js";

import {
  getUnitFromSensorType,
  validateDeviceReadingInput,
  validateReadingInput,
  validateReadingValue
} from "./readingValidationService.js";

import {
  evaluateEnvironmentalAlert
} from "./environmentalAlertService.js";

import {
  getAllReadings as findAllReadings,
  getReadingById as findReadingById,
  getSensorById as findSensorById,
  getReadingsBySensorId as findReadingsBySensorId,
  sensorBelongsToDevice,
  getDeviceByDeviceId,
  insertReading,
  updateSensorCurrentValue,
  insertReadingWithConnection,
  updateSensorCurrentValueWithConnection,
  getReadingsAggregate as findReadingsAggregate,
  getReadingTimeBounds as findReadingTimeBounds
} from "../repositories/readingRepository.js";

import { Sensor } from "../types/Sensor.js";


export async function getAllReadings(): Promise<Reading[]> {
  return findAllReadings();
}


export async function getReadingById(
  id: number
): Promise<Reading | undefined> {
  return findReadingById(id);
}


export async function createReading(
  reading: ReadingInput
): Promise<Reading> {
  validateReadingInput(reading);

  const sensor = await findSensorById(
    reading.sensorId
  );

  if (!sensor) {
    throw new AppError(
      "Sensor not found",
      404
    );
  }

  validateReadingValue(
    sensor.type,
    reading.value
  );

  const expectedUnit = getUnitFromSensorType(
    sensor.type
  );

  if (reading.unit !== expectedUnit) {
    throw new AppError(
      "Unit does not match sensor type",
      400
    );
  }

  const unit = expectedUnit;

  const timestamp = new Date(
    reading.timestamp
  );

  const id = await insertReading(
    reading.sensorId,
    reading.value,
    unit,
    timestamp
  );

  await updateSensorCurrentValue(
    reading.sensorId,
    reading.value,
    timestamp
  );

  await evaluateEnvironmentalAlert(
    reading.sensorId,
    sensor.type,
    reading.value,
    timestamp
  );

  return {
    id,
    sensorId: reading.sensorId,
    value: reading.value,
    unit,
    timestamp
  };
}

const DEFAULT_PAGE_SIZE = 500;
const MAX_PAGE_SIZE = 1000;

type ReadingCursor = {
  timestamp: string;
  id: number;
};

function decodeCursor(
  cursor: string
): { timestamp: Date; id: number } {
  try {
    const decoded = Buffer.from(cursor, "base64url").toString("utf8");
    const parsed = JSON.parse(decoded) as ReadingCursor;

    const timestamp = new Date(parsed.timestamp);

    if (
      !Number.isInteger(parsed.id) ||
      parsed.id <= 0 ||
      Number.isNaN(timestamp.getTime())
    ) {
      throw new Error("Invalid cursor values");
    }

    return {
      timestamp,
      id: parsed.id
    };
  } catch {
    throw new AppError("Invalid cursor", 400);
  }
}

function encodeCursor(reading: Reading): string {
  const cursor: ReadingCursor = {
    timestamp: new Date(reading.timestamp).toISOString(),
    id: reading.id
  };

  return Buffer.from(
    JSON.stringify(cursor),
    "utf8"
  ).toString("base64url");
}

export async function getReadingsBySensorId(
  sensorId: number,
  range: ReadingRange = "24h",
  limit = DEFAULT_PAGE_SIZE,
  cursor?: string
): Promise<ReadingHistoryPage> {
  if (!Number.isInteger(sensorId) || sensorId <= 0) {
    throw new AppError("Sensor id must be a positive integer", 400);
  }

  if (!["24h", "7d", "all"].includes(range)) {
    throw new AppError("Invalid reading range", 400);
  }

  if (
    !Number.isInteger(limit) ||
    limit <= 0 ||
    limit > MAX_PAGE_SIZE
  ) {
    throw new AppError(
      `Limit must be between 1 and ${MAX_PAGE_SIZE}`,
      400
    );
  }

  const sensor = await findSensorById(sensorId);

  if (!sensor) {
    throw new AppError("Sensor not found", 404);
  }

  const from =
    range === "24h"
      ? new Date(Date.now() - 24 * 60 * 60 * 1000)
      : range === "7d"
        ? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        : undefined;

  const decodedCursor = cursor
    ? decodeCursor(cursor)
    : undefined;

  const rows = await findReadingsBySensorId({
    sensorId,
    from,
    cursor: decodedCursor,
    limit: limit + 1
  });

  const hasMore = rows.length > limit;
  const readings = hasMore
    ? rows.slice(0, limit)
    : rows;

  const lastReading = readings[readings.length - 1];

  return {
    readings,
    nextCursor:
      hasMore && lastReading
        ? encodeCursor(lastReading)
        : null,
    hasMore
  };
}

export async function validateSensorBelongsToDevice(
  deviceId: string,
  sensorId: number
): Promise<void> {
  const belongsToDevice = await sensorBelongsToDevice(
    deviceId,
    sensorId
  );

  if (!belongsToDevice) {
    throw new AppError(
      "Sensor does not belong to device",
      400
    );
  }
}


export async function createDeviceReadings(
  input: DeviceReadingInput
): Promise<Reading[]> {
  validateDeviceReadingInput(input);

  const device = await getDeviceByDeviceId(
    input.deviceId
  );

  if (!device) {
    throw new AppError(
      "Device not found",
      404
    );
  }

  const validatedReadings: {
    sensorId: number;
    sensorType: Sensor["type"];
    value: number;
    unit: ReadingUnit;
    timestamp: Date;
  }[] = [];

  for (const reading of input.readings) {
    await validateSensorBelongsToDevice(
      input.deviceId,
      reading.sensorId
    );

    const sensor = await findSensorById(
      reading.sensorId
    );

    if (!sensor) {
      throw new AppError(
        "Sensor not found",
        404
      );
    }

    validateReadingValue(
      sensor.type,
      reading.value
    );

    const expectedUnit = getUnitFromSensorType(
      sensor.type
    );

    if (reading.unit !== expectedUnit) {
      throw new AppError(
        `Invalid unit for sensor ${reading.sensorId}`,
        400
      );
    }

    validatedReadings.push({
      sensorId: reading.sensorId,
      sensorType: sensor.type,
      value: reading.value,
      unit: reading.unit,
      timestamp: new Date(
        reading.timestamp
      )
    });
  }

  const connection = await db.getConnection();
  const createdReadings: Reading[] = [];

  try {
    await connection.beginTransaction();

    for (const reading of validatedReadings) {
      const id = await insertReadingWithConnection(
        connection,
        reading.sensorId,
        reading.value,
        reading.unit,
        reading.timestamp
      );

      await updateSensorCurrentValueWithConnection(
        connection,
        reading.sensorId,
        reading.value,
        reading.timestamp
      );

      createdReadings.push({
        id,
        sensorId: reading.sensorId,
        value: reading.value,
        unit: reading.unit,
        timestamp: reading.timestamp
      });
    }

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }

  for (const reading of validatedReadings) {
    await evaluateEnvironmentalAlert(
      reading.sensorId,
      reading.sensorType,
      reading.value,
      reading.timestamp
    );
  }

  return createdReadings;
}

const AGGREGATE_TARGET_POINTS = 400;
const AGGREGATE_BUCKET_CHOICES_SECONDS = [
  300, 900, 1800, 3600, 7200, 21600, 43200, 86400
];
const AGGREGATE_MIN_SPAN_SECONDS = 3600;
const AGGREGATE_CACHE_TTL_MS = 30_000;

const aggregateCache = new Map<
  string,
  { expiresAt: number; value: ReadingAggregate }
>();

/**
 * Picks the smallest "round" bucket size that keeps the number of points
 * at or below AGGREGATE_TARGET_POINTS (24h -> 5 min, 7d -> 30 min).
 */
function chooseBucketSeconds(spanSeconds: number): number {
  const ideal = spanSeconds / AGGREGATE_TARGET_POINTS;

  return (
    AGGREGATE_BUCKET_CHOICES_SECONDS.find(
      (choice) => choice >= ideal
    ) ??
    AGGREGATE_BUCKET_CHOICES_SECONDS[
      AGGREGATE_BUCKET_CHOICES_SECONDS.length - 1
    ]
  );
}

function round(value: number, decimals = 2): number {
  const factor = 10 ** decimals;

  return Math.round(value * factor) / factor;
}

export async function getReadingsAggregateBySensorId(
  sensorId: number,
  range: ReadingRange = "24h"
): Promise<ReadingAggregate> {
  if (!Number.isInteger(sensorId) || sensorId <= 0) {
    throw new AppError("Sensor id must be a positive integer", 400);
  }

  if (!["24h", "7d", "all"].includes(range)) {
    throw new AppError("Invalid reading range", 400);
  }

  const sensor = await findSensorById(sensorId);

  if (!sensor) {
    throw new AppError("Sensor not found", 404);
  }

  const cacheKey = `${sensorId}:${range}`;
  const cached = aggregateCache.get(cacheKey);

  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  let from: Date | undefined;
  let spanSeconds: number;

  if (range === "all") {
    const bounds = await findReadingTimeBounds(sensorId);

    if (!bounds) {
      return {
        range,
        bucketSeconds: AGGREGATE_BUCKET_CHOICES_SECONDS[0],
        points: []
      };
    }

    spanSeconds = Math.max(
      (bounds.lastAt.getTime() - bounds.firstAt.getTime()) / 1000,
      AGGREGATE_MIN_SPAN_SECONDS
    );
  } else {
    spanSeconds =
      range === "24h" ? 24 * 60 * 60 : 7 * 24 * 60 * 60;

    from = new Date(Date.now() - spanSeconds * 1000);
  }

  const bucketSeconds = chooseBucketSeconds(spanSeconds);

  const rows = await findReadingsAggregate(
    sensorId,
    from,
    bucketSeconds
  );

  const value: ReadingAggregate = {
    range,
    bucketSeconds,
    points: rows.map((row) => ({
      timestamp: row.timestamp,
      avg: round(Number(row.avg_value)),
      min: round(Number(row.min_value)),
      max: round(Number(row.max_value)),
      count: Number(row.sample_count)
    }))
  };

  aggregateCache.set(cacheKey, {
    expiresAt: Date.now() + AGGREGATE_CACHE_TTL_MS,
    value
  });

  return value;
}