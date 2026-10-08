import { db } from "../database/connection.js";
import { AppError } from "../errors/AppError.js";
import {
  ActuatorState,
  ControlMode
} from "../types/Actuator.js";
import {
  Command,
  CommandType
} from "../types/Command.js";

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
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [rows] = await connection.query(
      `
        SELECT
          commands.id,
          commands.actuator_id AS actuatorId,
          commands.type,
          commands.state,
          commands.control_mode AS controlMode,
          commands.status
        FROM commands
        INNER JOIN devices
          ON commands.device_id = devices.id
        WHERE commands.id = ?
          AND devices.device_id = ?
        FOR UPDATE
      `,
      [
        commandId,
        deviceId
      ]
    );

    const commands = rows as {
      id: number;
      actuatorId: number;
      type: CommandType;
      state: ActuatorState | null;
      controlMode: ControlMode | null;
      status: "PENDING" | "EXECUTED" | "FAILED";
    }[];

    const command = commands[0];

    if (!command) {
      throw new AppError(
        "Command not found or does not belong to device",
        404
      );
    }

    if (command.status !== "PENDING") {
      await connection.rollback();
      return;
    }

    if (!success) {
      await connection.query(
        `
          UPDATE commands
          SET
            status = 'FAILED',
            completed_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `,
        [commandId]
      );

      await connection.commit();
      return;
    }

    if (command.type === "SET_ACTUATOR_STATE") {
      await connection.query(
        `
          UPDATE actuators
          SET
            state = ?,
            last_update = CURRENT_TIMESTAMP
          WHERE id = ?
            AND device_id = (
              SELECT id
              FROM devices
              WHERE device_id = ?
            )
        `,
        [
          command.state,
          command.actuatorId,
          deviceId
        ]
      );
    }

    if (command.type === "SET_CONTROL_MODE") {
      await connection.query(
        `
          UPDATE actuators
          SET
            control_mode = ?,
            last_update = CURRENT_TIMESTAMP
          WHERE id = ?
            AND device_id = (
              SELECT id
              FROM devices
              WHERE device_id = ?
            )
        `,
        [
          command.controlMode,
          command.actuatorId,
          deviceId
        ]
      );
    }

    await connection.query(
      `
        UPDATE commands
        SET
          status = 'EXECUTED',
          completed_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `,
      [commandId]
    );

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function getActuatorForCommand(
  actuatorId: number
): Promise<{
  id: number;
  deviceId: number;
} | undefined> {
  const [rows] = await db.query(
    `
      SELECT
        id,
        device_id AS deviceId
      FROM actuators
      WHERE id = ?
    `,
    [actuatorId]
  );

  const actuators = rows as {
    id: number;
    deviceId: number;
  }[];

  return actuators[0];
}

export async function insertCommand(
  actuatorId: number,
  deviceId: number,
  type: CommandType,
  state: ActuatorState | null,
  controlMode: ControlMode | null
): Promise<Command> {
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
      deviceId,
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
    deviceId,
    actuatorId,
    type,
    state,
    controlMode,
    status: "PENDING",
    createdAt: new Date(),
    completedAt: null
  };
}