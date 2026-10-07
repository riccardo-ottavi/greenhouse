import { db } from "../database/connection.js";
import { Sensor } from "../types/Sensor.js";
import { SensorView } from "../types/SensorView.js";
import { getEnvironmentalAlert } from "./environmentalAlertService.js";

export async function getAllSensors(): Promise<Sensor[]> {
  const [rows] = await db.query(
    `
      SELECT
        id,
        device_id AS deviceId,
        name,
        type,
        status,
        sampling_interval AS samplingInterval,
        current_value AS currentValue,
        last_update AS lastUpdate,
        zone_id AS zoneId
      FROM sensors
    `
  );

  return rows as Sensor[];
}

export async function getSensorById(
  id: number
): Promise<Sensor> {
  const [rows] = await db.query(
    `
      SELECT
        id,
        device_id AS deviceId,
        name,
        type,
        status,
        sampling_interval AS samplingInterval,
        current_value AS currentValue,
        last_update AS lastUpdate,
        zone_id AS zoneId
      FROM sensors
      WHERE id = ?
    `,
    [id]
  );

  const sensors = rows as Sensor[];

  return sensors[0];
}

function toSensorView(sensor: Sensor): SensorView {
  return {
    ...sensor,
    alert: getEnvironmentalAlert(
      sensor.type,
      sensor.currentValue
    )
  };
}

export async function getAllSensorViews(): Promise<SensorView[]> {
  const sensors = await getAllSensors();

  return sensors.map(toSensorView);
}

export async function getSensorViewById(
  id: number
): Promise<SensorView> {
  const sensor = await getSensorById(id);

  return toSensorView(sensor);
}