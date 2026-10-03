import { Request, Response } from "express";
import { AppError } from "../errors/AppError.js";
import { completeCommand, getPendingCommands } from "../services/commandService.js";

export async function getPending(
  req: Request,
  res: Response
): Promise<void> {
  const deviceId = req.query.deviceId;

  if (!deviceId || typeof deviceId !== "string") {
    throw new AppError(
      "deviceId query parameter is required",
      400
    );
  }

  const commands = await getPendingCommands(deviceId);

  res.json({
    commands
  });
}

export async function commandResult(
  req: Request,
  res: Response
): Promise<void> {
  const { commandId, deviceId, success } = req.body;

  if (
    typeof commandId !== "number" ||
    typeof deviceId !== "string" ||
    typeof success !== "boolean"
  ) {
    throw new AppError(
      "commandId, deviceId and success are required",
      400
    );
  }

  await completeCommand(
    commandId,
    deviceId,
    success
  );

  res.json({
    message: "Command result received"
  });
}