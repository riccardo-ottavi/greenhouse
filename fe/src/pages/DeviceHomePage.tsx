
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
import TrendOverview from "../components/TrendOverview";
import { getActiveEnvironmentalAlerts } from "../api/environmentalAlert";
import type { EnvironmentalAlert } from "../types/EnvironmentalAlert";

const DEVICE_REFRESH_INTERVAL = 5000;

export default function DeviceHomePage() {
    const { id } = useParams();

    const [sensors, setSensors] = useState<Sensor[]>([]);
    const [actuators, setActuators] = useState<Actuator[]>([]);
    const [environmentalAlerts, setEnvironmentalAlerts] = useState<EnvironmentalAlert[]>([]);

    useEffect(() => {
        if (!id) return;

        const deviceId = Number(id);

        if (!Number.isInteger(deviceId) || deviceId <= 0) {
            return;
        }

        let cancelled = false;

        async function loadDeviceData() {
            try {
                const [sensorData, actuatorData, alertData] = await Promise.all([
                    getSensorsByDevice(deviceId),
                    getActuatorsByDevice(deviceId),
                    getActiveEnvironmentalAlerts(),
                ]);

                if (!cancelled) {
                    setSensors(sensorData);
                    setActuators(actuatorData);
                    setEnvironmentalAlerts(alertData);
                }
            } catch (error) {
                if (!cancelled) {
                    console.error(
                        "Couldn't load device dashboard data",
                        error
                    );
                }
            }
        }

        void loadDeviceData();

        const intervalId = window.setInterval(() => {
            void loadDeviceData();
        }, DEVICE_REFRESH_INTERVAL);

        return () => {
            cancelled = true;
            window.clearInterval(intervalId);
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
                        {sensors.map((sensor) => (
                            <SensorOverviewCard
                                key={sensor.id}
                                sensor={sensor}
                                alert={environmentalAlerts.find(
                                    (item) => item.sensorId === sensor.id
                                )}
                            />
                        ))}
                    </div>
                </div>

                <div className="dashboard-bottom">
                    <div className="trend-history">
                        <TrendOverview sensors={sensors} />
                    </div>

                    <div className="actuators-overview">
                        <ActuatorsOverview actuators={actuators} />
                    </div>
                </div>
            </div>
        </>
    );
}
