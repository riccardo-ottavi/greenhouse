import { db } from "../database/connection.js";
import { AppError } from "../errors/AppError.js";
import { Command } from "../types/Command.js";

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
        commands.id
      FROM commands
      INNER JOIN devices
        ON commands.device_id = devices.id
      WHERE commands.id = ?
        AND devices.device_id = ?
    `,
    [commandId, deviceId]
  );

  const commands = rows as { id: number }[];

  if (commands.length === 0) {
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
}