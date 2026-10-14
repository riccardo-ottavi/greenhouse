export type DeviceStatus = "ONLINE" | "OFFLINE" | "ERROR";

export type Device = {
  id: number;
  deviceId: string;
  name: string;
  status: DeviceStatus;
  lastSeen: string | null;
}