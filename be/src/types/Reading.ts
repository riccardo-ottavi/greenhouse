export type ReadingUnit = "°C" | "%" | "lux";

export type Reading = {
    id: number;
    sensorId: number;
    value: number;
    unit: ReadingUnit;
    timestamp: Date;
}