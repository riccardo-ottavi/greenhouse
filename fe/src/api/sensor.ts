import type { Sensor } from "../types/Sensor";

const API_URL = import.meta.env.VITE_API_URL;

export async function getSensorsByDevice(
  deviceId: number
): Promise<Sensor[]> {
  const response = await fetch(
    `${API_URL}/devices/${deviceId}/sensors`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch sensors for this device");
  }

  return response.json() as Promise<Sensor[]>;
}