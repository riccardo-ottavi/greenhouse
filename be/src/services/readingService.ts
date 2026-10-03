import { db } from "../database/connection.js";
import { DeviceReadingInput, Reading, ReadingInput, ReadingUnit } from "../types/Reading.js";
import { SensorType } from "../types/Sensor.js";
import { AppError } from "../errors/AppError.js";

export async function getAllReadings(): Promise<Reading[]> {
  const [rows] = await db.query(
    `
          SELECT
            id,
            sensor_id as sensorId,
            value,
            unit,
            timestamp
          FROM readings
        `
  );
  return rows as Reading[];
}

export async function getReadingById(
  id: number
): Promise<Reading | undefined> {
  const [rows] = await db.query(
    `
          SELECT
            id,
            sensor_id as sensorId,
            value,
            unit,
            timestamp
          FROM readings
          WHERE id = ?
        `,
    [id]
  );

  const reading = rows as Reading[];

  return reading[0];
}

export async function createReading(
  reading: ReadingInput
): Promise<Reading> {

  const [sensorRows] = await db.query(
    `
      SELECT
        id,
        type
      FROM sensors
      WHERE id = ?
    `,
    [reading.sensorId]
  );

  const sensors = sensorRows as {
    id: number;
    type: SensorType;
  }[];

  const sensor = sensors[0];

  if (!sensor) {
    throw new AppError("Sensor not found", 404);
  }

  validateReadingValue(sensor.type, reading.value);

  const unit = getUnitFromSensorType(sensor.type);

  const [result] = await db.query(
    `
      INSERT INTO readings
        (sensor_id, value, unit, timestamp)
    VALUES
      (?, ?, ?, ?)
  `,
    [
      reading.sensorId,
      reading.value,
      unit,
      new Date(reading.timestamp)
    ]
  );

  const insertResult = result as { insertId: number };

  await db.query(
    `
      UPDATE sensors
      SET
        current_value = ?,
        last_update = ?
      WHERE id = ?
    `,
    [
      reading.value,
      new Date(reading.timestamp),
      reading.sensorId
    ]
  );

  return {
    id: insertResult.insertId,
    sensorId: reading.sensorId,
    value: reading.value,
    unit: unit,
    timestamp: new Date(reading.timestamp)
  };
}

function validateReadingValue(
  type: SensorType,
  value: number
): void {
  switch (type) {
    case "TEMPERATURE":
      if (value < 0 || value > 50) {
        throw new AppError("Invalid temperature value", 400);
      }
      break;

    case "HUMIDITY":
      if (value < 0 || value > 100) {
        throw new AppError("Invalid humidity value", 400);
      }
      break;

    case "SOIL_MOISTURE":
      if (value < 0 || value > 100) {
        throw new AppError("Invalid soil moisture value", 400);
      }
      break;

    case "LIGHT":
      if (value < 0) {
        throw new AppError("Invalid light value", 400);
      }
      break;
  }
}

function getUnitFromSensorType(type: SensorType): ReadingUnit {
  switch (type) {
    case "TEMPERATURE":
      return "°C";

    case "HUMIDITY":
      return "%";

    case "SOIL_MOISTURE":
      return "%";

    case "LIGHT":
      return "lux";
    default:
      throw new Error("Unsupported sensor type");
  }
}

export async function getReadingsBySensorId(
  sensorId: number
): Promise<Reading[]> {
  const [sensorRows] = await db.query(
    `
      SELECT id
      FROM sensors
      WHERE id = ?
    `,
    [sensorId]
  );

  const sensors = sensorRows as { id: number }[];

  if (sensors.length === 0) {
    throw new AppError("Sensor not found", 404);
  }

  const [rows] = await db.query(
    `
      SELECT
        id,
        sensor_id AS sensorId,
        value,
        unit,
        timestamp
      FROM readings
      WHERE sensor_id = ?
      ORDER BY timestamp DESC
    `,
    [sensorId]
  );

  return rows as Reading[];
}

export async function validateSensorBelongsToDevice(
  deviceId: string,
  sensorId: number
): Promise<void> {
  const [rows] = await db.query(
    `
      SELECT
        sensors.id
      FROM sensors
      INNER JOIN devices
        ON sensors.device_id = devices.id
      WHERE devices.device_id = ?
        AND sensors.id = ?
    `,
    [deviceId, sensorId]
  );

  const sensors = rows as { id: number }[];

  if (sensors.length === 0) {
    throw new AppError(
      "Sensor does not belong to device",
      400
    );
  }
}

export async function createDeviceReadings(
  input: DeviceReadingInput
): Promise<Reading[]> {
  const [deviceRows] = await db.query(
    `
      SELECT
        id
      FROM devices
      WHERE device_id = ?
    `,
    [input.deviceId]
  );

  const devices = deviceRows as { id: number }[];

  if (devices.length === 0) {
    throw new AppError("Device not found", 404);
  }

  const createdReadings: Reading[] = [];

  for (const reading of input.readings) {
    await validateSensorBelongsToDevice(
      input.deviceId,
      reading.sensorId
    );

    const [sensorRows] = await db.query(
      `
        SELECT
          id,
          type
        FROM sensors
        WHERE id = ?
      `,
      [reading.sensorId]
    );

    const sensors = sensorRows as {
      id: number;
      type: SensorType;
    }[];

    const sensor = sensors[0];

    validateReadingValue(sensor.type, reading.value);

    const expectedUnit = getUnitFromSensorType(sensor.type);

    if (reading.unit !== expectedUnit) {
      throw new AppError(
        `Invalid unit for sensor ${reading.sensorId}`,
        400
      );
    }

    const [result] = await db.query(
      `
        INSERT INTO readings
          (sensor_id, value, unit, timestamp)
        VALUES
          (?, ?, ?, ?)
      `,
      [
        reading.sensorId,
        reading.value,
        reading.unit,
        new Date(reading.timestamp)
      ]
    );

    const insertResult = result as { insertId: number };

    await db.query(
      `
        UPDATE sensors
        SET
          current_value = ?,
          last_update = ?
        WHERE id = ?
      `,
      [
        reading.value,
        new Date(reading.timestamp),
        reading.sensorId
      ]
    );

    createdReadings.push({
      id: insertResult.insertId,
      sensorId: reading.sensorId,
      value: reading.value,
      unit: reading.unit,
      timestamp: new Date(reading.timestamp)
    });
  }

  return createdReadings;
}