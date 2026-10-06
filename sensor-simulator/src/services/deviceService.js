import deviceState from "../state/deviceState.js";
import { executeCommand } from "./commandService.js";

const BACKEND_URL = "http://localhost:3000";
const DEVICE_ID = "GREENHOUSE_001";

export async function getPendingCommands() {
  const response = await fetch(
    `${BACKEND_URL}/api/device/commands?deviceId=${DEVICE_ID}`
  );

  if (!response.ok) {
    throw new Error(
      `Failed to get commands: ${response.status}`
    );
  }

  const data = await response.json();

  return data.commands;
}

export async function sendCommandResult(
  commandId,
  success
) {
  const response = await fetch(
    `${BACKEND_URL}/api/device/command-results`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        commandId,
        deviceId: DEVICE_ID,
        success
      })
    }
  );

  if (!response.ok) {
    throw new Error(
      `Failed to send command result: ${response.status}`
    );
  }

  return response.json();
}

export async function processPendingCommands() {
  const commands = await getPendingCommands();

  for (const command of commands) {
    const result = executeCommand(command);

    await sendCommandResult(
      command.id,
      result.success
    );
  }
}

export async function initializeDeviceState() {
    const response = await fetch(
        `${BACKEND_URL}/api/device/config?deviceId=${DEVICE_ID}`
    );

    if (!response.ok) {
        throw new Error(
            `Failed to get device configuration: ${response.status}`
        );
    }

    const data = await response.json();

    for (const actuator of data.actuators) {
        const localActuator =
            deviceState.actuators[actuator.actuatorId];

        if (!localActuator) {
            continue;
        }

        localActuator.state = actuator.state;
        localActuator.controlMode = actuator.controlMode;
    }

    console.log("Device state initialized from backend");
}

export async function startCommandPolling() {
  console.log("Command polling started");

  setInterval(async () => {
    try {
      await processPendingCommands();
    } catch (error) {
      console.error(
        "Command polling error:",
        error.message
      );
    }
  }, 2000);
}

export function getActuatorState(actuatorId) {
  return deviceState.actuators[actuatorId];
}

export async function sendDeviceStatus() {
  const response = await fetch(
    `${BACKEND_URL}/api/device/status`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        deviceId: DEVICE_ID,
        actuators: Object.entries(deviceState.actuators).map(
          ([actuatorId, actuator]) => ({
            actuatorId: Number(actuatorId),
            state: actuator.state,
            controlMode: actuator.controlMode
          })
        )
      })
    }
  );

  if (!response.ok) {
    throw new Error(
      `Failed to send device status: ${response.status}`
    );
  }

  return response.json();
}

export async function startHeartbeat() {
  console.log("Heartbeat started");

  try {
    await sendHeartbeat();
    console.log("Heartbeat sent");
  } catch (error) {
    console.error(
      "Heartbeat error:",
      error.message
    );
  }

  setInterval(async () => {
    try {
      await sendHeartbeat();
      console.log("Heartbeat sent");
    } catch (error) {
      console.error(
        "Heartbeat error:",
        error.message
      );
    }
  }, 10000);
}

export async function sendHeartbeat() {
  const response = await fetch(
    `${BACKEND_URL}/api/device/heartbeat`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        deviceId: DEVICE_ID
      })
    }
  );

  if (!response.ok) {
    throw new Error(
      `Failed to send heartbeat: ${response.status}`
    );
  }

  return response.json();
}