import { db } from "../database/connection.js";
import { Reading, ReadingInput, ReadingUnit } from "../types/Reading.js";
import { SensorType } from "../types/Sensor.js";

export async function getAllReadings(){
    const [rows] = await db.query(
        `
          SELECT
            id,
            sensor_id as sensorId,
            value,
            unit,
            timestamp
          FROM readings
        `
      );
      return rows as Reading[];
}

export async function getReadingById(id: number){
    const [rows] = await db.query(
        `
          SELECT
            id,
            sensor_id as sensorId,
            value,
            unit,
            timestamp
          FROM readings
          WHERE id = ?
        `,
        [id]
      );
    
      const reading = rows as Reading[];
    
      return reading[0];
}

export async function createReading(
  reading: Omit<Reading, "id">
): Promise<Reading> {

  const [sensorRows] = await db.query(
    `
      SELECT
        id,
        type
      FROM sensors
      WHERE id = ?
    `,
    [reading.sensorId]
  );

  const sensors = sensorRows as {
    id: number;
    type: SensorType;
  }[];

  const sensor = sensors[0];

  if (!sensor) {
    throw new Error("Sensor not found");
  }

  const unit = getUnitFromSensorType(sensor.type);

  const [result] = await db.query(
    `
      INSERT INTO readings
        (sensor_id, value, unit, timestamp)
    VALUES
      (?, ?, ?, ?)
  `,
    [
      reading.sensorId,
      reading.value,
      unit,
      new Date(reading.timestamp)
    ]
  );

  const insertResult = result as { insertId: number };

  await db.query(
    `
      UPDATE sensors
      SET
        current_value = ?,
        last_update = ?
      WHERE id = ?
    `,
    [
      reading.value,
      new Date(reading.timestamp),
      reading.sensorId
    ]
  );

  return {
    id: insertResult.insertId,
    sensorId: reading.sensorId,
    value: reading.value,
    unit: unit,
    timestamp: reading.timestamp
  };
}

function getUnitFromSensorType(type: SensorType): ReadingUnit {
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