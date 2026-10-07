export type SensorType =
  | "TEMPERATURE"
  | "HUMIDITY"
  | "SOIL_MOISTURE"
  | "LIGHT";

export type SensorStatus =
  | "ONLINE"
  | "OFFLINE"
  | "ERROR";

export type Sensor = {
    id: number;
    deviceId: number;
    name: string;
    type: SensorType;
    status: SensorStatus;
    samplingInterval: number;
    currentValue: number;
    lastUpdate: Date;
    zoneId: number;
}