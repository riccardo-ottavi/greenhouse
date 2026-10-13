
export type SensorType =
  | "TEMPERATURE"
  | "HUMIDITY"
  | "SOIL_MOISTURE"
  | "LIGHT";

export type SensorStatus =
  | "ONLINE"
  | "OFFLINE"
  | "ERROR";

export interface Sensor {
  id: number;
  name: string;
  type: SensorType;
  status: SensorStatus;
  samplingInterval: number;
  currentValue: number;
  lastUpdate: string | null;
  zoneId: number;
}
