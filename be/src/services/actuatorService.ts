import { db } from "../database/connection.js";
import { Actuator } from "../types/Actuator.js";

export async function getAllActuators(): Promise<Actuator[]> {
  const [rows] = await db.query(
    `
      SELECT
        id,
        device_id AS deviceId,
        name,
        type,
        state,
        control_mode AS controlMode,
        last_update AS lastUpdate
      FROM actuators
    `
  );

  return rows as Actuator[];
}

export async function getActuatorById(
  id: number
): Promise<Actuator | undefined> {
  const [rows] = await db.query(
    `
      SELECT
        id,
        device_id AS deviceId,
        name,
        type,
        state,
        control_mode AS controlMode,
        last_update AS lastUpdate
      FROM actuators
      WHERE id = ?
    `,
    [id]
  );

  const actuators = rows as Actuator[];

  return actuators[0];
}