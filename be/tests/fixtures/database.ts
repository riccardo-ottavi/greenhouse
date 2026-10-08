import crypto from "crypto";

import { db } from "../../src/database/connection.js";

export const TEST_DEVICE_ID = "GREENHOUSE_TEST";
export const TEST_API_KEY = "test-device-api-key";

export async function resetTestDatabase(): Promise<void> {
  await db.query("DELETE FROM commands");
  await db.query("DELETE FROM readings");
  await db.query("DELETE FROM actuators");
  await db.query("DELETE FROM sensors");
  await db.query("DELETE FROM devices");
}

export async function seedTestDatabase(): Promise<void> {
  const apiKeyHash = crypto
    .createHash("sha256")
    .update(TEST_API_KEY)
    .digest("hex");

  const [deviceResult] = await db.query(`
    INSERT INTO devices (
      device_id,
      name,
      status,
      api_key_hash
    )
    VALUES (?, ?, 'OFFLINE', ?)
  `, [
    TEST_DEVICE_ID,
    "Test Greenhouse",
    apiKeyHash
  ]);

  const deviceId = (
    deviceResult as { insertId: number }
  ).insertId;

  const sensorValues = [
    ["Test Temperature", "TEMPERATURE", 22],
    ["Test Humidity", "HUMIDITY", 65],
    ["Test Soil Moisture", "SOIL_MOISTURE", 45],
    ["Test Light", "LIGHT", 10000]
  ] as const;

  for (const [name, type, currentValue] of sensorValues) {
    await db.query(`
      INSERT INTO sensors (
        device_id,
        name,
        type,
        status,
        sampling_interval,
        current_value,
        last_update,
        zone_id
      )
      VALUES (?, ?, ?, 'ONLINE', 60, ?, NOW(), 1)
    `, [
      deviceId,
      name,
      type,
      currentValue
    ]);
  }

  const actuatorTypes = [
    ["Test Water Pump", "WATER_PUMP"],
    ["Test Ventilation Fan", "VENTILATION_FAN"],
    ["Test Grow Light", "GROW_LIGHT"]
  ] as const;

  for (const [name, type] of actuatorTypes) {
    await db.query(`
      INSERT INTO actuators (
        device_id,
        name,
        type,
        state,
        control_mode
      )
      VALUES (?, ?, ?, 'OFF', 'AUTO')
    `, [
      deviceId,
      name,
      type
    ]);
  }
}