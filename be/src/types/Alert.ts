export type AlertType =
  | "WARNING"
  | "CRITICAL";

export type Alert = {
  id: number;
  sensorId: number;
  type: AlertType;
  message: string;
  timestamp: Date;
};