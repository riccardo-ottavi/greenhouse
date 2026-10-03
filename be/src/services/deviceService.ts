import { db } from "../database/connection";
import { Device } from "../types/Device";

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