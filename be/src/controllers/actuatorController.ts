import { Request, Response } from "express";
import { AppError } from "../errors/AppError.js";
import {
  getAllActuators,
  getActuatorById
} from "../services/actuatorService.js";
import { createCommand } from "../services/commandService.js";

export async function index(
  _req: Request,
  res: Response
): Promise<void> {
  const actuators = await getAllActuators();

  res.json(actuators);
}

export async function show(
  req: Request,
  res: Response
): Promise<void> {
  const id = Number(req.params.id);

  if (Number.isNaN(id)) {
    throw new AppError(
      "Actuator id must be a number",
      400
    );
  }

  const actuator = await getActuatorById(id);

  if (!actuator) {
    throw new AppError(
      "Actuator not found",
      404
    );
  }

  res.json(actuator);
}

export async function command(
  req: Request,
  res: Response
): Promise<void> {
  const actuatorId = Number(req.params.id);

  if (Number.isNaN(actuatorId)) {
    throw new AppError(
      "Actuator id must be a number",
      400
    );
  }

  const {
    type,
    state,
    controlMode
  } = req.body;

  const command = await createCommand(
    actuatorId,
    type,
    state ?? null,
    controlMode ?? null
  );

  res.status(201).json(command);
}