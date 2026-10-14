import Hero from "../components/Hero";
import menuSensor from "../assets/icons/menu-sensor.svg";
import SensorOverviewCard from "../components/SensorOverviewCard";
import { useParams } from "react-router-dom";
import type { Sensor } from "../types/Sensor";
import { useEffect, useState } from "react";
import { getSensorsByDevice } from "../api/sensor";
import ActuatorsOverview from "../components/ActuatorsOverview";
import type { Actuator } from "../types/Actuator";
import { getActuatorsByDevice } from "../api/actuator";

export default function DeviceHomePage() {

    const { id } = useParams();

    const [sensors, setSensors] = useState<Sensor[]>([]);
    const [actuators, setActuators] = useState<Actuator[]>([]);

    useEffect(() => {
        if (!id) return;
        const deviceId = Number(id);

        if (!Number.isInteger(deviceId) || deviceId <= 0) {
            return;
        }

        let cancelled = false;

        async function loadDeviceData() {
            try {
                const [sensorData, actuatorData] = await Promise.all([
                    getSensorsByDevice(deviceId),
                    getActuatorsByDevice(deviceId),
                ]);

                if (!cancelled) {
                    setSensors(sensorData);
                    setActuators(actuatorData);
                }
            } catch (error) {
                console.error("Couldn't load device dashboard data", error);
            }
        }

        void loadDeviceData();

        return () => {
            cancelled = true;
        };
    }, [id]);

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
                        {sensors.map((s) => (
                            <SensorOverviewCard
                                key={s.id}
                                sensor={s}
                            />
                        ))}
                    </div>


                </div>
                    <div className="dashboard-bottom">
                        <div className="trend-history">

                        </div>
                        <div className="actuators-overview">
                            <ActuatorsOverview
                                actuators={actuators}
                            />
                        </div>
                </div>
            </div>
        </>

    )
}