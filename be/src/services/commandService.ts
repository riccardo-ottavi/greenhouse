import { db } from "../database/connection.js";
import { AppError } from "../errors/AppError.js";
import { ActuatorState, ControlMode } from "../types/Actuator.js";
import { Command, CommandType } from "../types/Command.js";

export async function getPendingCommands(
  deviceId: string
): Promise<Command[]> {
  const [rows] = await db.query(
    `
      SELECT
        commands.id,
        commands.device_id AS deviceId,
        commands.actuator_id AS actuatorId,
        commands.type,
        commands.state,
        commands.control_mode AS controlMode,
        commands.status,
        commands.created_at AS createdAt,
        commands.completed_at AS completedAt
      FROM commands
      INNER JOIN devices
        ON commands.device_id = devices.id
      WHERE devices.device_id = ?
        AND commands.status = 'PENDING'
      ORDER BY commands.created_at ASC
    `,
    [deviceId]
  );

  return rows as Command[];
}

export async function completeCommand(
  commandId: number,
  deviceId: string,
  success: boolean
): Promise<void> {
  const [rows] = await db.query(
    `
      SELECT
        commands.id,
        commands.actuator_id AS actuatorId,
        commands.type,
        commands.state,
        commands.control_mode AS controlMode
      FROM commands
      INNER JOIN devices
        ON commands.device_id = devices.id
      WHERE commands.id = ?
        AND devices.device_id = ?
    `,
    [commandId, deviceId]
  );

  const commands = rows as {
    id: number;
    actuatorId: number;
    type: CommandType;
    state: ActuatorState | null;
    controlMode: ControlMode | null;
  }[];

  const command = commands[0];

  if (!command) {
    throw new AppError(
      "Command not found or does not belong to device",
      404
    );
  }

  await db.query(
    `
      UPDATE commands
      SET
        status = ?,
        completed_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
    [
      success ? "EXECUTED" : "FAILED",
      commandId
    ]
  );

  if (!success) {
    return;
  }

  if (command.type === "SET_ACTUATOR_STATE") {
    await db.query(
      `
        UPDATE actuators
        SET
          state = ?,
          last_update = CURRENT_TIMESTAMP
        WHERE id = ?
      `,
      [
        command.state,
        command.actuatorId
      ]
    );
  }

  if (command.type === "SET_CONTROL_MODE") {
    await db.query(
      `
        UPDATE actuators
        SET
          control_mode = ?,
          last_update = CURRENT_TIMESTAMP
        WHERE id = ?
      `,
      [
        command.controlMode,
        command.actuatorId
      ]
    );
  }
}

export async function createCommand(
  actuatorId: number,
  type: CommandType,
  state: ActuatorState | null,
  controlMode: ControlMode | null
): Promise<Command> {
  const [actuatorRows] = await db.query(
    `
      SELECT
        id,
        device_id AS deviceId
      FROM actuators
      WHERE id = ?
    `,
    [actuatorId]
  );

  const actuators = actuatorRows as {
    id: number;
    deviceId: number;
  }[];

  const actuator = actuators[0];

  if (!actuator) {
    throw new AppError(
      "Actuator not found",
      404
    );
  }

  if (type === "SET_ACTUATOR_STATE") {
    if (state === null || controlMode !== null) {
      throw new AppError(
        "Invalid payload for SET_ACTUATOR_STATE",
        400
      );
    }
  }

  if (type === "SET_CONTROL_MODE") {
    if (controlMode === null || state !== null) {
      throw new AppError(
        "Invalid payload for SET_CONTROL_MODE",
        400
      );
    }
  }

  const [result] = await db.query(
    `
      INSERT INTO commands (
        device_id,
        actuator_id,
        type,
        state,
        control_mode,
        status
      )
      VALUES (?, ?, ?, ?, ?, 'PENDING')
    `,
    [
      actuator.deviceId,
      actuatorId,
      type,
      state,
      controlMode
    ]
  );

  const insertResult = result as {
    insertId: number;
  };

  return {
    id: insertResult.insertId,
    deviceId: actuator.deviceId,
    actuatorId,
    type,
    state,
    controlMode,
    status: "PENDING",
    createdAt: new Date(),
    completedAt: null
  };
}