import { db } from "../database/connection.js";
import { Actuator, ActuatorState, ControlMode } from "../types/Actuator.js";

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

export async function updateActuatorStatus(
  deviceId: string,
  actuatorId: number,
  state: ActuatorState,
  controlMode: ControlMode
): Promise<void> {
  const [result] = await db.query(
    `
      UPDATE actuators
      SET
        state = ?,
        control_mode = ?,
        last_update = NOW()
      WHERE id = ?
        AND device_id = (
          SELECT id
          FROM devices
          WHERE device_id = ?
        )
    `,
    [state, controlMode, actuatorId, deviceId]
  );

  const updateResult = result as { affectedRows: number };

  if (updateResult.affectedRows === 0) {
    throw new Error("Actuator not found for the specified device");
  }
}