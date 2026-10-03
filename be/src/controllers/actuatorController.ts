import { Request, Response } from "express";
import { AppError } from "../errors/AppError.js";
import {
  getAllActuators,
  getActuatorById
} from "../services/actuatorService.js";

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