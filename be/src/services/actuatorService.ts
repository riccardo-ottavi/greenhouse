import { AppError } from "../errors/AppError.js";

import {
  Actuator,
  ActuatorState,
  ControlMode
} from "../types/Actuator.js";

import {
  getAllActuators as findAllActuators,
  getActuatorById as findActuatorById,
  updateActuatorStatus as updateActuator
} from "../repositories/actuatorRepository.js";

export async function getAllActuators(): Promise<Actuator[]> {
  return findAllActuators();
}

export async function getActuatorById(
  id: number
): Promise<Actuator | undefined> {
  return findActuatorById(id);
}

export async function updateActuatorStatus(
  deviceId: string,
  actuatorId: number,
  state: ActuatorState,
  controlMode: ControlMode
): Promise<void> {
  const updated = await updateActuator(
    deviceId,
    actuatorId,
    state,
    controlMode
  );

  if (!updated) {
    throw new AppError(
      "Actuator not found for the specified device",
      404
    );
  }
}