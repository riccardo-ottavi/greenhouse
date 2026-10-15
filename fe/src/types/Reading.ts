export type ReadingUnit = "°C" | "%" | "lux";

export interface Reading {
  id: number;
  sensorId: number;
  value: number;
  unit: ReadingUnit;
  timestamp: string;
}