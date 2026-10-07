import {
  EnvironmentalAlertType
} from "../types/EnvironmentalAlert.js";

import {
  SensorType
} from "../types/Sensor.js";

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