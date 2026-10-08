import { db } from "../database/connection.js";
import { Device } from "../types/Device.js";
import { DeviceView } from "../types/Device.js";

export async function getAllDevices(): Promise<DeviceView[]> {
  const [rows] = await db.query(
    `
      SELECT
        id,
        device_id AS deviceId,
        name,
        status,
        last_seen AS lastSeen,
        created_at AS createdAt
      FROM devices
    `
  );

  return rows as DeviceView[];
}

export async function getDeviceById(
  id: number
): Promise<DeviceView | undefined> {
  const [rows] = await db.query(
    `
      SELECT
        id,
        device_id AS deviceId,
        name,
        status,
        last_seen AS lastSeen,
        created_at AS createdAt
      FROM devices
      WHERE id = ?
    `,
    [id]
  );

  const devices = rows as DeviceView[];

  return devices[0];
}

export async function getDeviceActuatorStates(
  deviceId: string
): Promise<
  {
    actuatorId: number;
    state: "ON" | "OFF";
    controlMode: "AUTO" | "MANUAL";
  }[]
> {
  const [rows] = await db.query(
    `
      SELECT
        actuators.id AS actuatorId,
        actuators.state,
        actuators.control_mode AS controlMode
      FROM actuators
      INNER JOIN devices
        ON actuators.device_id = devices.id
      WHERE devices.device_id = ?
      ORDER BY actuators.id ASC
    `,
    [deviceId]
  );

  return rows as {
    actuatorId: number;
    state: "ON" | "OFF";
    controlMode: "AUTO" | "MANUAL";
  }[];
}

export async function updateHeartbeat(
  deviceId: string
): Promise<boolean> {
  const [result] = await db.query(
    `
      UPDATE devices
      SET
        status = 'ONLINE',
        last_seen = CURRENT_TIMESTAMP
      WHERE device_id = ?
    `,
    [deviceId]
  );

  return (result as { affectedRows: number }).affectedRows > 0;
}

export async function markOfflineDevices(
  thresholdSeconds: number
): Promise<void> {
  await db.query(
    `
      UPDATE devices
      SET status = 'OFFLINE'
      WHERE status = 'ONLINE'
        AND (
          last_seen IS NULL
          OR last_seen < CURRENT_TIMESTAMP - INTERVAL ? SECOND
        )
    `,
    [thresholdSeconds]
  );
}