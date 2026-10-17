
import type { EnvironmentalAlert } from "../types/EnvironmentalAlert";

const API_URL = import.meta.env.VITE_API_URL;

export async function getActiveEnvironmentalAlerts():
    Promise<EnvironmentalAlert[]> {
    const response = await fetch(
        `${API_URL}/environmental-alerts`
    );

    if (!response.ok) {
        throw new Error(
            "Failed to fetch environmental alerts"
        );
    }

    return response.json() as Promise<EnvironmentalAlert[]>;
}
