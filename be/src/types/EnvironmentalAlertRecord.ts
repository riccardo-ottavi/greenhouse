import { EnvironmentalAlertType } from "./EnvironmentalAlert.js";

export type EnvironmentalAlertStatus =
    | "ACTIVE"
    | "RESOLVED";

export type EnvironmentalAlertRecord = {
    id: number;
    sensorId: number;
    type: EnvironmentalAlertType;
    status: EnvironmentalAlertStatus;
    triggeredValue: number;
    triggeredAt: Date;
    resolvedAt: Date | null;
};