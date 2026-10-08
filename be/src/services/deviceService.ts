import { DeviceView } from "../types/Device.js";


import {
  getAllDevices as findAllDevices,
  getDeviceById as findDeviceById,
  getDeviceActuatorStates as findDeviceActuatorStates,
  updateHeartbeat as updateDeviceHeartbeat,
  markOfflineDevices as markDevicesOffline
} from "../repositories/deviceRepository.js";

const DEVICE_OFFLINE_THRESHOLD_SECONDS = 30;

export async function getAllDevices(): Promise<DeviceView[]> {
  return findAllDevices();
}

export async function getDeviceById(
  id: number
): Promise<DeviceView | undefined> {
  return findDeviceById(id);
}

export async function getDeviceActuatorStates(
  deviceId: string
) {
  return findDeviceActuatorStates(deviceId);
}

export async function updateHeartbeat(
  deviceId: string
): Promise<boolean> {
  return updateDeviceHeartbeat(deviceId);
}

export async function markOfflineDevices(): Promise<void> {
  await markDevicesOffline(
    DEVICE_OFFLINE_THRESHOLD_SECONDS
  );
}