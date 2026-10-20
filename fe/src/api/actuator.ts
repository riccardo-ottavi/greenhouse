
import type { Actuator } from "../types/Actuator";

const API_URL = import.meta.env.VITE_API_URL;

export async function getActuatorsByDevice(
    deviceId: number
): Promise<Actuator[]> {
    const response = await fetch(
        `${API_URL}/devices/${deviceId}/actuators`
    );

    if (!response.ok) {
        throw new Error("Failed to fetch actuators for this device");
    }

    return response.json() as Promise<Actuator[]>;
}

type ActuatorCommand =
    | {
          type: "SET_ACTUATOR_STATE";
          state: "ON" | "OFF";
      }
    | {
          type: "SET_CONTROL_MODE";
          controlMode: "AUTO" | "MANUAL";
      };

export async function sendActuatorCommand(
    actuatorId: number,
    command: ActuatorCommand
): Promise<void> {
    const response = await fetch(
        `${API_URL}/actuators/${actuatorId}/command`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(command),
        }
    );

    if (!response.ok) {
        const errorMessage = await response.text();

        throw new Error(
            errorMessage || "Failed to send actuator command"
        );
    }
}
