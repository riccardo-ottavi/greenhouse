import { db } from "../database/connection.js";
import {
  Reading,
  ReadingUnit,
  ReadingHistoryQuery
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
  query: ReadingHistoryQuery
): Promise<Reading[]> {
  const conditions = ["sensor_id = ?"];
  const values: (number | Date)[] = [query.sensorId];

  if (query.from) {
    conditions.push("timestamp >= ?");
    values.push(query.from);
  }

  if (query.cursor) {
    conditions.push(`
      (
        timestamp < ?
        OR (
          timestamp = ?
          AND id < ?
        )
      )
    `);

    values.push(
      query.cursor.timestamp,
      query.cursor.timestamp,
      query.cursor.id
    );
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
      WHERE ${conditions.join(" AND ")}
      ORDER BY timestamp DESC, id DESC
      LIMIT ?
    `,
    [
      ...values,
      query.limit
    ]
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

export async function getReadingTimeBounds(
  sensorId: number
): Promise<{ firstAt: Date; lastAt: Date } | undefined> {
  const [rows] = await db.query(
    `
      SELECT
        MIN(timestamp) AS first_at,
        MAX(timestamp) AS last_at
      FROM readings
      WHERE sensor_id = ?
    `,
    [sensorId]
  );

  const row = (rows as {
    first_at: Date | null;
    last_at: Date | null;
  }[])[0];

  if (!row || !row.first_at || !row.last_at) {
    return undefined;
  }

  return {
    firstAt: row.first_at,
    lastAt: row.last_at
  };
}

export async function getReadingsAggregate(
  sensorId: number,
  from: Date | undefined,
  bucketSeconds: number
): Promise<{
  timestamp: Date;
  avg_value: number;
  min_value: number;
  max_value: number;
  sample_count: number;
}[]> {
  const conditions = ["sensor_id = ?"];
  const values: (number | Date)[] = [sensorId];

  if (from) {
    conditions.push("timestamp >= ?");
    values.push(from);
  }

  const [rows] = await db.query(
    `
      SELECT
        FLOOR(
          TIMESTAMPDIFF(SECOND, '1970-01-01 00:00:00', timestamp) / ?
        ) AS bucket,
        MIN(timestamp) AS timestamp,
        AVG(value) AS avg_value,
        MIN(value) AS min_value,
        MAX(value) AS max_value,
        COUNT(*) AS sample_count
      FROM readings
      WHERE ${conditions.join(" AND ")}
      GROUP BY bucket
      ORDER BY bucket ASC
    `,
    [bucketSeconds, ...values]
  );

  return rows as {
    timestamp: Date;
    avg_value: number;
    min_value: number;
    max_value: number;
    sample_count: number;
  }[];
}