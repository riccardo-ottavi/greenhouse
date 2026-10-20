import { Link } from "react-router-dom";
import type { Device } from "../types/Device";

export default function DeviceCard(device: Device) {
    const lastSeenLabel = device.lastSeen
        ? new Date(device.lastSeen).toLocaleString()
        : "Never connected";

    const statusLabel = {
        ONLINE: "Online",
        OFFLINE: "Offline",
        ERROR: "Error",
    }[device.status];

    return (
        <Link
            to={`/devices/${device.id}`}
            className="device-card"
            aria-label={`Open dashboard for ${device.name}`}
        >
            <div className="device-card-icon" aria-hidden="true">
                <span>GH</span>
            </div>

            <div className="device-card-info">
                <h3>{device.name}</h3>
                <span className="device-card-id">{device.deviceId}</span>
            </div>

            <div className="device-card-meta">
                <span className={`device-status status-${device.status.toLowerCase()}`}>
                    <span className="device-status-dot" />
                    {statusLabel}
                </span>

                <span className="device-last-seen">
                    Last heartbeat: {lastSeenLabel}
                </span>
            </div>

            <span className="device-card-arrow" aria-hidden="true">
                →
            </span>
        </Link>
    );
}