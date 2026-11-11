export type ReadingUnit = "°C" | "%" | "lux";
 
export type ReadingRange = "24h" | "7d" | "all";
 
export interface Reading {
  id: number;
  sensorId: number;
  value: number;
  unit: ReadingUnit;
  timestamp: string;
}
 
export interface ReadingHistoryPage {
  readings: Reading[];
  nextCursor: string | null;
  hasMore: boolean;
}
 
export interface ReadingHistory {
  readings: Reading[];
  truncated: boolean;
}
 
export interface ReadingAggregatePoint {
  timestamp: string;
  avg: number;
  min: number;
  max: number;
  count: number;
}
 
export interface ReadingAggregate {
  range: ReadingRange;
  bucketSeconds: number;
  points: ReadingAggregatePoint[];
}