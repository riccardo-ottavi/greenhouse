
import { useEffect, useState } from "react";
import { fetchDeviceList } from "../api/device";
import DeviceCard from "../components/DeviceCard";
import type { Device } from "../types/Device";

export default function HomePage() {
    const [deviceList, setDeviceList] = useState<Device[]>([]);

    useEffect(() => {
        let cancelled = false;

        fetchDeviceList()
            .then((data) => {
                if (!cancelled) {
                    setDeviceList(data);
                }
            })
            .catch((error) => {
                if (!cancelled) {
                    console.error("Couldn't load devices", error);
                }
            });

        return () => {
            cancelled = true;
        };
    }, []);

    return (
        <div className="homepage page">
            <h1>Devices List</h1>

            <ul>
                {deviceList.map((d) => (
                    <li key={d.id}>
                        <DeviceCard
                            id={d.id}
                            name={d.name}
                            status={d.status}
                            deviceId={d.deviceId}
                            lastSeen={d.lastSeen}
                        />
                    </li>
                ))}
            </ul>
        </div>
    );
}
