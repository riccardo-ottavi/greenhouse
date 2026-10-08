import { db } from "../database/connection.js";
import {
  Reading,
  ReadingUnit
} from "../types/Reading.js";
import { SensorType } from "../types/Sensor.js";
import type { PoolConnection } from "mysql2/promise";

export async function getAllReadings(): Promise<Reading[]> {
  const [rows] = await db.query(
    `
      SELECT
        id,
        sensor_id AS sensorId,
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
        sensor_id AS sensorId,
        value,
        unit,
        timestamp
      FROM readings
      WHERE id = ?
    `,
    [id]
  );

  const readings = rows as Reading[];

  return readings[0];
}

export async function getSensorById(
  sensorId: number
): Promise<{
  id: number;
  type: SensorType;
} | undefined> {
  const [rows] = await db.query(
    `
      SELECT
        id,
        type
      FROM sensors
      WHERE id = ?
    `,
    [sensorId]
  );

  const sensors = rows as {
    id: number;
    type: SensorType;
  }[];

  return sensors[0];
}

export async function getReadingsBySensorId(
  sensorId: number
): Promise<Reading[]> {
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

export async function sensorBelongsToDevice(
  deviceId: string,
  sensorId: number
): Promise<boolean> {
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
    [
      deviceId,
      sensorId
    ]
  );

  const sensors = rows as {
    id: number;
  }[];

  return sensors.length > 0;
}

export async function getDeviceByDeviceId(
  deviceId: string
): Promise<{ id: number } | undefined> {
  const [rows] = await db.query(
    `
      SELECT
        id
      FROM devices
      WHERE device_id = ?
    `,
    [deviceId]
  );

  const devices = rows as {
    id: number;
  }[];

  return devices[0];
}

export async function insertReading(
  sensorId: number,
  value: number,
  unit: ReadingUnit,
  timestamp: Date
): Promise<number> {
  const [result] = await db.query(
    `
      INSERT INTO readings
        (sensor_id, value, unit, timestamp)
      VALUES
        (?, ?, ?, ?)
    `,
    [
      sensorId,
      value,
      unit,
      timestamp
    ]
  );

  const insertResult = result as {
    insertId: number;
  };

  return insertResult.insertId;
}

export async function updateSensorCurrentValue(
  sensorId: number,
  value: number,
  timestamp: Date
): Promise<void> {
  await db.query(
    `
      UPDATE sensors
      SET
        current_value = ?,
        last_update = ?
      WHERE id = ?
    `,
    [
      value,
      timestamp,
      sensorId
    ]
  );
}

export async function insertReadingWithConnection(
  connection: PoolConnection,
  sensorId: number,
  value: number,
  unit: ReadingUnit,
  timestamp: Date
): Promise<number> {
  const [result] = await connection.query(
    `
      INSERT INTO readings
        (sensor_id, value, unit, timestamp)
      VALUES
        (?, ?, ?, ?)
    `,
    [
      sensorId,
      value,
      unit,
      timestamp
    ]
  );

  const insertResult = result as {
    insertId: number;
  };

  return insertResult.insertId;
}

export async function updateSensorCurrentValueWithConnection(
  connection: PoolConnection,
  sensorId: number,
  value: number,
  timestamp: Date
): Promise<void> {
  await connection.query(
    `
      UPDATE sensors
      SET
        current_value = ?,
        last_update = ?
      WHERE id = ?
    `,
    [
      value,
      timestamp,
      sensorId
    ]
  );
}