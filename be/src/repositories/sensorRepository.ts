import { db } from "../database/connection.js";
import { Sensor } from "../types/Sensor.js";

export async function getAllSensors(): Promise<Sensor[]> {
  const [rows] = await db.query(
    `
      SELECT
        id,
        device_id AS deviceId,
        name,
        type,
        status,
        sampling_interval AS samplingInterval,
        current_value AS currentValue,
        last_update AS lastUpdate,
        zone_id AS zoneId
      FROM sensors
    `
  );

  return rows as Sensor[];
}

export async function getSensorById(
  id: number
): Promise<Sensor | undefined> {
  const [rows] = await db.query(
    `
      SELECT
        id,
        device_id AS deviceId,
        name,
        type,
        status,
        sampling_interval AS samplingInterval,
        current_value AS currentValue,
        last_update AS lastUpdate,
        zone_id AS zoneId
      FROM sensors
      WHERE id = ?
    `,
    [id]
  );

  const sensors = rows as Sensor[];

  return sensors[0];
}