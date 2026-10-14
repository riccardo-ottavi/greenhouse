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