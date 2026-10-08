import { AppError } from "../errors/AppError.js";

import {
  ActuatorState,
  ControlMode
} from "../types/Actuator.js";

import {
  Command,
  CommandType
} from "../types/Command.js";

import {
  getPendingCommands as findPendingCommands,
  completeCommand as completeCommandInRepository,
  getActuatorForCommand,
  insertCommand
} from "../repositories/commandRepository.js";

export async function getPendingCommands(
  deviceId: string
): Promise<Command[]> {
  return findPendingCommands(deviceId);
}

export async function completeCommand(
  commandId: number,
  deviceId: string,
  success: boolean
): Promise<void> {
  await completeCommandInRepository(
    commandId,
    deviceId,
    success
  );
}

export async function createCommand(
  actuatorId: number,
  type: CommandType,
  state: ActuatorState | null,
  controlMode: ControlMode | null
): Promise<Command> {
  const actuator = await getActuatorForCommand(
    actuatorId
  );

  if (!actuator) {
    throw new AppError(
      "Actuator not found",
      404
    );
  }

  if (
    type !== "SET_ACTUATOR_STATE" &&
    type !== "SET_CONTROL_MODE"
  ) {
    throw new AppError(
      "Invalid command type",
      400
    );
  }

  if (
    state !== null &&
    state !== "ON" &&
    state !== "OFF"
  ) {
    throw new AppError(
      "Invalid actuator state",
      400
    );
  }

  if (
    controlMode !== null &&
    controlMode !== "AUTO" &&
    controlMode !== "MANUAL"
  ) {
    throw new AppError(
      "Invalid control mode",
      400
    );
  }

  if (type === "SET_ACTUATOR_STATE") {
    if (
      state === null ||
      controlMode !== null
    ) {
      throw new AppError(
        "Invalid payload for SET_ACTUATOR_STATE",
        400
      );
    }
  }

  if (type === "SET_CONTROL_MODE") {
    if (
      controlMode === null ||
      state !== null
    ) {
      throw new AppError(
        "Invalid payload for SET_CONTROL_MODE",
        400
      );
    }
  }

  return insertCommand(
    actuatorId,
    actuator.deviceId,
    type,
    state,
    controlMode
  );
}