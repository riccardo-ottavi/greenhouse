import type { Reading } from "../types/Reading";
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

export async function getReadingsBySensor(
  sensorId: number
): Promise<Reading[]> {
  const response = await fetch(
    `${API_URL}/sensors/${sensorId}/readings`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch readings for this sensor");
  }

  return response.json() as Promise<Reading[]>;
}