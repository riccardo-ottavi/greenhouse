import { useEffect, useState } from "react";
import { fetchDeviceList } from "../api/device";
import DeviceCard from "../components/DeviceCard";
import type { Device } from "../types/Device";

export default function HomePage() {

    const [deviceList, setDeviceList] = useState<Device[]>([])


    useEffect(() => {
        loadDeviceList();
    }, [])

    async function loadDeviceList() {
        try {
            const data = await fetchDeviceList();
            setDeviceList(data);
        } catch (error) {

            console.error(
                "Couldn't load devices",
                error
            );
        }
    }

    return (
        <div className="homepage page">
            <h1>Devices List</h1>
            <ul>
                {deviceList.map((d) => (
                    <li>
                        <DeviceCard
                            id={d.id}
                            deviceId={d.deviceId}
                            name={d.name}
                            status={d.status}
                            lastSeen={d.lastSeen}
                        />
                    </li>
                ))}
            </ul>
        </div>
    )
}