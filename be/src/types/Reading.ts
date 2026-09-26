export type ReadingUnit = "°C" | "%" | "lux";

export type ReadingInput = {
    sensorId: number;
    value: number;
    timestamp?: string | Date;
};

export type Reading = {
    id: number;
    sensorId: number;
    value: number;
    unit: ReadingUnit;
    timestamp: Date;
}