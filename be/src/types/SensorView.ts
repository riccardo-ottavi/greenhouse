import { Sensor } from "./Sensor.js";
import { EnvironmentalAlertType } from "./EnvironmentalAlert.js";

export type SensorView = Sensor & {
    alert: EnvironmentalAlertType | null;
};