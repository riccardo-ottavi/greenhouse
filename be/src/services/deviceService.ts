import { db } from "../database/connection";
import { Device } from "../types/Device";

const DEVICE_OFFLINE_THRESHOLD_SECONDS = 30;

export async function getAllDevices(): Promise<Device[]> {
  const [rows] = await db.query(
    `
      SELECT
        id,
        device_id AS deviceId,
        name,
        status,
        api_key_hash AS apiKeyHash,
        last_seen AS lastSeen,
        created_at AS createdAt
      FROM devices
    `
  );

  return rows as Device[];
}

export async function getDeviceActuatorStates(
  deviceId: string
) {
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

export async function getDeviceById(
  id: number
): Promise<Device> {
  const [rows] = await db.query(
    `
      SELECT
        id,
        device_id AS deviceId,
        name,
        status,
        api_key_hash AS apiKeyHash,
        last_seen AS lastSeen,
        created_at AS createdAt
      FROM devices
      WHERE id = ?
    `,
    [id]
  );

  const devices = rows as Device[];

  return devices[0];
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

  return (result as any).affectedRows > 0;
}

export async function markOfflineDevices(): Promise<void> {
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
    [DEVICE_OFFLINE_THRESHOLD_SECONDS]
  );
}