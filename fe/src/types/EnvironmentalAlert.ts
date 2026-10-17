
export type EnvironmentalAlertType =
    | "HIGH_TEMPERATURE"
    | "HIGH_HUMIDITY"
    | "LOW_SOIL_MOISTURE"
    | "LOW_LIGHT";

export interface EnvironmentalAlert {
    id: number;
    sensorId: number;
    type: EnvironmentalAlertType;
    status: "ACTIVE" | "RESOLVED";
    triggeredValue: number;
    triggeredAt: string;
    resolvedAt: string | null;
}
