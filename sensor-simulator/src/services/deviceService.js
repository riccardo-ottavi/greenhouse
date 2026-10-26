
import deviceState, {
  initializeDeviceState as setDeviceState
} from "../state/deviceState.js";
import { executeCommand } from "./commandService.js";

export const BACKEND_URL =
  process.env.BACKEND_URL || "http://localhost:3000";

const CONFIGURED_DEVICE_ID =
  process.env.SIMULATOR_DEVICE_ID || "GREENHOUSE_001";

const API_KEY = process.env.DEVICE_API_KEY;

if (!API_KEY) {
  throw new Error("DEVICE_API_KEY is not configured");
}

export const DEVICE_HEADERS = {
  "Content-Type": "application/json",
  "X-API-Key": API_KEY
};

function getDeviceId() {
  if (!deviceState.deviceId) {
    throw new Error("Device state has not been initialized");
  }

  return deviceState.deviceId;
}

export async function getPendingCommands() {
  const deviceId = getDeviceId();

  const response = await fetch(
    `${BACKEND_URL}/api/device/commands?deviceId=${encodeURIComponent(deviceId)}`,
    {
      headers: DEVICE_HEADERS
    }
  );

  if (!response.ok) {
    throw new Error(
      `Failed to get commands: ${response.status}`
    );
  }

  const data = await response.json();

  return data.commands;
}

export async function sendCommandResult(commandId, success) {
  const deviceId = getDeviceId();

  const response = await fetch(
    `${BACKEND_URL}/api/device/command-results`,
    {
      method: "POST",
      headers: DEVICE_HEADERS,
      body: JSON.stringify({
        commandId,
        deviceId,
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
    const result = await executeCommand(command);

    await sendCommandResult(
      command.id,
      result.success
    );
  }
}

export async function initializeDeviceState() {
  const response = await fetch(
    `${BACKEND_URL}/api/device/config?deviceId=${encodeURIComponent(CONFIGURED_DEVICE_ID)}`,
    {
      headers: DEVICE_HEADERS
    }
  );

  if (!response.ok) {
    throw new Error(
      `Failed to get device configuration: ${response.status}`
    );
  }

  const data = await response.json();

  if (
    typeof data.deviceId !== "string" ||
    !Array.isArray(data.sensors) ||
    !Array.isArray(data.actuators)
  ) {
    throw new Error("Invalid device configuration received from backend");
  }

  setDeviceState(data);

  console.log(
    `Device ${deviceState.deviceId} initialized: ` +
    `${data.sensors.length} sensors, ` +
    `${data.actuators.length} actuators`
  );
}

export function startCommandPolling() {
  console.log("Command polling started");

  const intervalId = setInterval(async () => {
    try {
      await processPendingCommands();
    } catch (error) {
      console.error(
        "Command polling error:",
        error.message
      );
    }
  }, 2000);

  return function stopCommandPolling() {
    clearInterval(intervalId);
    console.log("Command polling stopped");
  };
}

export function getActuatorState(actuatorId) {
  return deviceState.actuators[actuatorId];
}

export async function sendDeviceStatus() {
  const deviceId = getDeviceId();

  const response = await fetch(
    `${BACKEND_URL}/api/device/status`,
    {
      method: "POST",
      headers: DEVICE_HEADERS,
      body: JSON.stringify({
        deviceId,
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


export function startHeartbeat() {
  console.log("Heartbeat started");

  async function sendHeartbeatSafely() {
    try {
      await sendHeartbeat();
      console.log("Heartbeat sent");
    } catch (error) {
      console.error(
        "Heartbeat error:",
        error.message
      );
    }
  }

  void sendHeartbeatSafely();

  const intervalId = setInterval(() => {
    void sendHeartbeatSafely();
  }, 10000);

  return function stopHeartbeat() {
    clearInterval(intervalId);
    console.log("Heartbeat stopped");
  };
}


export async function sendHeartbeat() {
  const deviceId = getDeviceId();

  const response = await fetch(
    `${BACKEND_URL}/api/device/heartbeat`,
    {
      method: "POST",
      headers: DEVICE_HEADERS,
      body: JSON.stringify({
        deviceId
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

export async function sendExternalWeather(weather) {
  const deviceId = getDeviceId();

  const response = await fetch(
    `${BACKEND_URL}/api/device/weather`,
    {
      method: "POST",
      headers: DEVICE_HEADERS,
      body: JSON.stringify({
        deviceId,
        temperature: weather.temperature,
        humidity: weather.humidity,
        source: weather.source,
        observedAt: weather.observedAt
      })
    }
  );

  if (!response.ok) {
    throw new Error(
      `Failed to send external weather: ${response.status}`
    );
  }

  return response.json();
}
