import { db } from "../database/connection.js";

import {
  DeviceReadingInput,
  Reading,
  ReadingInput,
  ReadingUnit
} from "../types/Reading.js";

import { AppError } from "../errors/AppError.js";

import {
  getUnitFromSensorType,
  validateDeviceReadingInput,
  validateReadingInput,
  validateReadingValue
} from "./readingValidationService.js";

import {
  getEnvironmentalAlert
} from "./environmentalAlertService.js";

import {
  getAllReadings as findAllReadings,
  getReadingById as findReadingById,
  getSensorById as findSensorById,
  getReadingsBySensorId as findReadingsBySensorId,
  sensorBelongsToDevice,
  getDeviceByDeviceId,
  insertReading,
  updateSensorCurrentValue,
  insertReadingWithConnection,
  updateSensorCurrentValueWithConnection
} from "../repositories/readingRepository.js";

export async function getAllReadings(): Promise<Reading[]> {
  return findAllReadings();
}

export async function getReadingById(
  id: number
): Promise<Reading | undefined> {
  return findReadingById(id);
}

export async function createReading(
  reading: ReadingInput
): Promise<Reading> {
  validateReadingInput(reading);

  const sensor = await findSensorById(
    reading.sensorId
  );

  if (!sensor) {
    throw new AppError(
      "Sensor not found",
      404
    );
  }

  validateReadingValue(
    sensor.type,
    reading.value
  );

  const expectedUnit = getUnitFromSensorType(sensor.type);

  if (reading.unit !== expectedUnit) {
    throw new AppError("Unit does not match sensor type", 400);
  }

  const unit = expectedUnit;

  const timestamp = new Date(
    reading.timestamp
  );

  const id = await insertReading(
    reading.sensorId,
    reading.value,
    unit,
    timestamp
  );

  await updateSensorCurrentValue(
    reading.sensorId,
    reading.value,
    timestamp
  );

  return {
    id,
    sensorId: reading.sensorId,
    value: reading.value,
    unit,
    timestamp
  };
}

export async function getReadingsBySensorId(
  sensorId: number
): Promise<Reading[]> {
  const sensor = await findSensorById(
    sensorId
  );

  if (!sensor) {
    throw new AppError(
      "Sensor not found",
      404
    );
  }

  return findReadingsBySensorId(
    sensorId
  );
}

export async function validateSensorBelongsToDevice(
  deviceId: string,
  sensorId: number
): Promise<void> {
  const belongsToDevice =
    await sensorBelongsToDevice(
      deviceId,
      sensorId
    );

  if (!belongsToDevice) {
    throw new AppError(
      "Sensor does not belong to device",
      400
    );
  }
}

export async function createDeviceReadings(
  input: DeviceReadingInput
): Promise<Reading[]> {
  validateDeviceReadingInput(input);

  const device = await getDeviceByDeviceId(
    input.deviceId
  );

  if (!device) {
    throw new AppError(
      "Device not found",
      404
    );
  }

  const validatedReadings: {
    sensorId: number;
    value: number;
    unit: ReadingUnit;
    timestamp: Date;
  }[] = [];

  for (const reading of input.readings) {
    await validateSensorBelongsToDevice(
      input.deviceId,
      reading.sensorId
    );

    const sensor = await findSensorById(
      reading.sensorId
    );

    if (!sensor) {
      throw new AppError(
        "Sensor not found",
        404
      );
    }

    validateReadingValue(
      sensor.type,
      reading.value
    );

    const expectedUnit =
      getUnitFromSensorType(
        sensor.type
      );

    if (reading.unit !== expectedUnit) {
      throw new AppError(
        `Invalid unit for sensor ${reading.sensorId}`,
        400
      );
    }

    const alert = getEnvironmentalAlert(
      sensor.type,
      reading.value
    );

    if (alert) {
      console.log(
        `Environmental alert: ${alert} (sensor ${reading.sensorId}, value: ${reading.value}${reading.unit})`
      );
    }

    validatedReadings.push({
      sensorId: reading.sensorId,
      value: reading.value,
      unit: reading.unit,
      timestamp: new Date(
        reading.timestamp
      )
    });
  }

  const connection =
    await db.getConnection();

  try {
    await connection.beginTransaction();

    const createdReadings: Reading[] = [];

    for (const reading of validatedReadings) {
      const id =
        await insertReadingWithConnection(
          connection,
          reading.sensorId,
          reading.value,
          reading.unit,
          reading.timestamp
        );

      await updateSensorCurrentValueWithConnection(
        connection,
        reading.sensorId,
        reading.value,
        reading.timestamp
      );

      createdReadings.push({
        id,
        sensorId: reading.sensorId,
        value: reading.value,
        unit: reading.unit,
        timestamp: reading.timestamp
      });
    }

    await connection.commit();

    return createdReadings;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}