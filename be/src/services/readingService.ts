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
  input: ReadingInput
): Promise<Reading> {

  const [sensorRows] = await db.query(
    `
      SELECT
        id,
        type
      FROM sensors
      WHERE id = ?
    `,
    [input.sensorId]
  );

  const sensors = sensorRows as { id: number; type: SensorType }[];

  const sensor = sensors[0];

  if (!sensor) {
    throw new Error("Sensor not found");
  }

  const unit = getUnitFromSensorType(sensor.type);
  const timestamp = input.timestamp ? new Date(input.timestamp) : new Date();

  if (Number.isNaN(timestamp.getTime())) {
    throw new Error("Invalid reading timestamp");
  }

  const [result] = await db.query(
    `
      INSERT INTO readings
        (sensor_id, value, unit, timestamp)
      VALUES
        (?, ?, ?, ?)
    `,
    [
      input.sensorId,
      input.value,
      unit,
      timestamp
    ]
  );

  const insertResult = result as { insertId: number };

  return {
    id: insertResult.insertId,
    sensorId: input.sensorId,
    value: input.value,
    unit: unit,
    timestamp
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