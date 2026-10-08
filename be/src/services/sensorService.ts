import { getAllSensors, getSensorById } from "../repositories/sensorRepository.js";
import { Sensor } from "../types/Sensor.js";
import { SensorView } from "../types/SensorView.js";
import { getEnvironmentalAlert } from "./environmentalAlertService.js";


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
): Promise<SensorView | undefined> {
  const sensor = await getSensorById(id);

  if (!sensor) {
    return undefined;
  }

  return toSensorView(sensor);
}