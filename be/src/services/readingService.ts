import { db } from "../database/connection.js";
import { Reading } from "../types/Reading.js";

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
      reading.unit,
      new Date(reading.timestamp)
    ]
  );

  const insertResult = result as { insertId: number };

  return {
    id: insertResult.insertId,
    ...reading
  };
}