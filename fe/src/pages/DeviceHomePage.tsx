import Hero from "../components/Hero";
import menuSensor from "../assets/icons/menu-sensor.svg";
import SensorOverviewCard from "../components/SensorOverviewCard";
import { useParams } from "react-router-dom";
import type { Sensor } from "../types/Sensor";
import { useEffect, useState } from "react";
import { getSensorsByDevice } from "../api/sensor";

export default function DeviceHomePage() {

    const { id } = useParams();

    const [sensors, setSensors] = useState<Sensor[]>([]);

    useEffect(() => {
        loadSensors();
    }, [id])

    async function loadSensors() {
        if (!id) return;

        const deviceId = Number(id);

        if (!Number.isInteger(deviceId) || deviceId <= 0) {
            return;
        }

        const data = await getSensorsByDevice(deviceId);
        console.log(data)
        setSensors(data);
    }



    return (
        <>
            <div className="device-homepage-container page">
                <Hero />
                <div className="sensors-overview">
                    <div className="sensors-overview-header">
                        <img src={menuSensor} alt="" />
                        <div className="sensors-overview-text">
                            <h3>Sensors</h3>
                            <span>Sensors state and values</span>
                        </div>

                    </div>
                    <div className="sensors-overview-row">
                        <SensorOverviewCard />
                        <SensorOverviewCard />
                        <SensorOverviewCard />
                        <SensorOverviewCard />
                    </div>
                    <div className="trend-history">

                    </div>
                </div>
            </div>
        </>

    )
}