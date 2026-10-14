import type { Device } from "../types/Device";

const API_URL = import.meta.env.VITE_API_URL;

export async function fetchDeviceList(): Promise<Device[]> {
  const deviceRes = await fetch(`${API_URL}/devices`);

  if (!deviceRes.ok) {
    throw new Error("Couldn't fetch devices from API");
  }

  const deviceList: Device[] = await deviceRes.json();

  console.log(deviceList)

  return deviceList;
}