export type SensorType =
  | "TEMPERATURE"
  | "HUMIDITY"
  | "SOIL_MOISTURE"
  | "LIGHT";

export type SensorStatus =
  | "ONLINE"
  | "OFFLINE"
  | "WARNING"
  | "ERROR";

export type Sensor = {
    id: number;
    name: string;
    type: SensorType;
    status: SensorStatus;
    samplingInterval: number;
    currentValue: number;
    lastUpdate: Date;
    zoneId: number;
}