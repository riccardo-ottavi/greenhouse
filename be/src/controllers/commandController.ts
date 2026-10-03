import { Request, Response } from "express";
import { AppError } from "../errors/AppError.js";
import { getPendingCommands } from "../services/commandService.js";

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