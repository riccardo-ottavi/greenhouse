
import {
    EnvironmentalAlertType
} from "../types/EnvironmentalAlert.js";

import {
    SensorType
} from "../types/Sensor.js";

import {
    createEnvironmentalAlert,
    findActiveAlertBySensorAndType,
    findActiveEnvironmentalAlerts,
    resolveEnvironmentalAlert
} from "../repositories/environmentalAlertRepository.js";

import {
    EnvironmentalAlertRecord
} from "../types/EnvironmentalAlertRecord.js";

export function getEnvironmentalAlert(
    sensorType: SensorType,
    value: number
): EnvironmentalAlertType | null {
    switch (sensorType) {
        case "TEMPERATURE":
            return value > 30
                ? "HIGH_TEMPERATURE"
                : null;

        case "HUMIDITY":
            return value > 80
                ? "HIGH_HUMIDITY"
                : null;

        case "SOIL_MOISTURE":
            return value < 20
                ? "LOW_SOIL_MOISTURE"
                : null;

        case "LIGHT":
            return value < 5000
                ? "LOW_LIGHT"
                : null;
    }
}

export async function evaluateEnvironmentalAlert(
    sensorId: number,
    sensorType: SensorType,
    value: number,
    timestamp: Date
): Promise<void> {
    const alertType = getEnvironmentalAlert(sensorType, value);

    const activeAlertTypes: EnvironmentalAlertType[] = [
        "HIGH_TEMPERATURE",
        "HIGH_HUMIDITY",
        "LOW_SOIL_MOISTURE",
        "LOW_LIGHT"
    ];

    for (const type of activeAlertTypes) {
        const activeAlert = await findActiveAlertBySensorAndType(
            sensorId,
            type
        );

        if (type === alertType) {
            if (!activeAlert) {
                await createEnvironmentalAlert(
                    sensorId,
                    type,
                    value,
                    timestamp
                );
            }
        } else if (activeAlert) {
            await resolveEnvironmentalAlert(
                activeAlert.id,
                timestamp
            );
        }
    }
}

export async function getActiveEnvironmentalAlerts():
    Promise<EnvironmentalAlertRecord[]> {
    return findActiveEnvironmentalAlerts();
}
