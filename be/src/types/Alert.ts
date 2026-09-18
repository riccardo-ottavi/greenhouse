export type AlertType =
  | "WARNING"
  | "CRITICAL";

export type Alert = {
  id: number;
  sensorId: string;
  type: AlertType;
  message: string;
  timestamp: Date;
};