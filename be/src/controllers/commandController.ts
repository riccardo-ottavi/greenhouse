
import { Request, Response } from "express";
import { AppError } from "../errors/AppError.js";
import {
  completeCommand,
  getPendingCommands
} from "../services/commandService.js";

export async function getPending(
  req: Request,
  res: Response
): Promise<void> {
  const deviceId = req.authenticatedDeviceId;

  if (!deviceId) {
    throw new AppError(
      "Authenticated device is required",
      401
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
  const { commandId, success } = req.body;
  const deviceId = req.authenticatedDeviceId;

  if (!deviceId) {
    throw new AppError(
      "Authenticated device is required",
      401
    );
  }

  if (
    typeof commandId !== "number" ||
    typeof success !== "boolean"
  ) {
    throw new AppError(
      "commandId and success are required",
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
