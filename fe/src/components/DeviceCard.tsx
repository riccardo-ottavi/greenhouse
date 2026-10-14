import type { Device } from "../types/Device";

export default function DeviceCard(device: Device){
    return(
        <div className="device-card">
            <span>{device.name}</span>
            <span>{device.status}</span>
            <span>{device.lastSeen}</span>
        </div>
    )
}