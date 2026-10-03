import deviceState from "../state/deviceState.js";

export function executeCommand(command) {
  const actuator = deviceState.actuators[command.actuatorId];

  if (!actuator) {
    return {
      success: false,
      message: "Actuator not found"
    };
  }

  if (command.type === "SET_ACTUATOR_STATE") {
    actuator.state = command.state;

    return {
      success: true
    };
  }

  if (command.type === "SET_CONTROL_MODE") {
    actuator.controlMode = command.controlMode;

    return {
      success: true
    };
  }

  return {
    success: false,
    message: "Unsupported command type"
  };
}