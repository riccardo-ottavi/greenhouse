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