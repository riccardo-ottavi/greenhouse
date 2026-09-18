export type ReadingUnit = "°C" | "%" | "lux";

export type Reading = {
    id: number;
    sensorId: string;
    value: number;
    unit: ReadingUnit;
    timestamp: Date;
}