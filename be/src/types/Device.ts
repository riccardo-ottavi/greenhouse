export type DeviceStatus =
    | "ONLINE"
    | "OFFLINE";

export type Device = {
    id: number;
    deviceId: string;
    name: string;
    status: DeviceStatus;
    apiKeyHash: string;
    lastSeen: Date | null;
    createdAt: Date;
};