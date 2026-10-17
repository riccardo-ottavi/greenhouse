
import type { ExternalWeather } from "../types/ExternalWeather";

const API_URL = import.meta.env.VITE_API_URL;

export async function getExternalWeather(): Promise<ExternalWeather | null> {
  const response = await fetch(`${API_URL}/weather`);

  if (!response.ok) {
    throw new Error("Failed to fetch external weather");
  }

  const data: { weather: ExternalWeather | null } =
    await response.json();

  return data.weather;
}
