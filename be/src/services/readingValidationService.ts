import {
  DeviceReadingInput,
  ReadingInput,
  ReadingUnit
} from "../types/Reading.js";

import {
  SensorType
} from "../types/Sensor.js";

import {
  AppError
} from "../errors/AppError.js";

export function validateReadingInput(
  reading: unknown
): asserts reading is ReadingInput {
  if (!reading || typeof reading !== "object") {
    throw new AppError("Invalid reading", 400);
  }

  const data = reading as Record<string, unknown>;

  if (
    typeof data.sensorId !== "number" ||
    !Number.isInteger(data.sensorId)
  ) {
    throw new AppError("sensorId must be an integer", 400);
  }

  if (
    typeof data.value !== "number" ||
    !Number.isFinite(data.value)
  ) {
    throw new AppError("value must be a finite number", 400);
  }

  if (
    data.unit !== "°C" &&
    data.unit !== "%" &&
    data.unit !== "lux"
  ) {
    throw new AppError("Invalid reading unit", 400);
  }

  if (
    typeof data.timestamp !== "string" ||
    Number.isNaN(new Date(data.timestamp).getTime())
  ) {
    throw new AppError("Invalid reading timestamp", 400);
  }
}

export function validateDeviceReadingInput(
  input: unknown
): asserts input is DeviceReadingInput {
  if (!input || typeof input !== "object") {
    throw new AppError("Invalid request body", 400);
  }

  const data = input as Record<string, unknown>;

  if (
    typeof data.deviceId !== "string" ||
    data.deviceId.trim().length === 0
  ) {
    throw new AppError("deviceId is required", 400);
  }

  if (!Array.isArray(data.readings)) {
    throw new AppError("readings must be an array", 400);
  }

  if (data.readings.length === 0) {
    throw new AppError(
      "readings must contain at least one reading",
      400
    );
  }

  for (const reading of data.readings) {
    validateReadingInput(reading);
  }
}

export function validateReadingValue(
  type: SensorType,
  value: number
): void {
  switch (type) {
    case "TEMPERATURE":
      if (value < 0 || value > 50) {
        throw new AppError(
          "Invalid temperature value",
          400
        );
      }
      break;

    case "HUMIDITY":
      if (value < 0 || value > 100) {
        throw new AppError(
          "Invalid humidity value",
          400
        );
      }
      break;

    case "SOIL_MOISTURE":
      if (value < 0 || value > 100) {
        throw new AppError(
          "Invalid soil moisture value",
          400
        );
      }
      break;

    case "LIGHT":
      if (value < 0) {
        throw new AppError(
          "Invalid light value",
          400
        );
      }
      break;
  }
}

export function getUnitFromSensorType(
  type: SensorType
): ReadingUnit {
  switch (type) {
    case "TEMPERATURE":
      return "°C";

    case "HUMIDITY":
      return "%";

    case "SOIL_MOISTURE":
      return "%";

    case "LIGHT":
      return "lux";

    default:
      throw new Error("Unsupported sensor type");
  }
}