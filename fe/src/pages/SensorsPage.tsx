
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import SensorOverviewCard from "../components/SensorOverviewCard";

import { getSensorsByDevice } from "../api/sensor";
import { getActiveEnvironmentalAlerts } from "../api/environmentalAlert";

import type { Sensor } from "../types/Sensor";
import type { EnvironmentalAlert } from "../types/EnvironmentalAlert";

const REFRESH_INTERVAL = 5000;

export default function SensorsPage() {
    const { id } = useParams();
    const deviceId = Number(id);

    const [sensors, setSensors] = useState<Sensor[]>([]);
    const [environmentalAlerts, setEnvironmentalAlerts] = useState<
        EnvironmentalAlert[]
    >([]);

    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [refreshKey, setRefreshKey] = useState(0);

    useEffect(() => {
        if (!Number.isInteger(deviceId) || deviceId <= 0) {
            setErrorMessage("Invalid device ID.");
            setIsLoading(false);
            return;
        }

        let cancelled = false;
        let requestInProgress = false;

        async function loadSensors(showLoading = false) {
            if (requestInProgress) return;

            requestInProgress = true;

            if (showLoading) {
                setIsLoading(true);
            }

            try {
                const [sensorData, alertData] = await Promise.all([
                    getSensorsByDevice(deviceId),
                    getActiveEnvironmentalAlerts(),
                ]);

                if (cancelled) return;

                setSensors(sensorData);
                setEnvironmentalAlerts(alertData);
                setErrorMessage(null);
            } catch (error) {
                if (cancelled) return;

                console.error("Couldn't load sensors", error);

                setErrorMessage(
                    "Unable to load sensors. Please check your connection and try again."
                );
            } finally {
                requestInProgress = false;

                if (!cancelled && showLoading) {
                    setIsLoading(false);
                }
            }
        }

        void loadSensors(true);

        const intervalId = window.setInterval(() => {
            void loadSensors();
        }, REFRESH_INTERVAL);

        return () => {
            cancelled = true;
            window.clearInterval(intervalId);
        };
    }, [deviceId, refreshKey]);

    const onlineCount = sensors.filter(
        (sensor) => sensor.status === "ONLINE"
    ).length;

    const attentionCount = sensors.filter(
        (sensor) =>
            sensor.status === "OFFLINE" || sensor.status === "ERROR"
    ).length;

    return (
        <main className="homepage sensors-page page">
            <section className="homepage-header">
                <div>
                    <span className="homepage-eyebrow">
                        GREENHOUSE / DEVICE / SENSORS
                    </span>

                    <h1>Sensors</h1>

                    <p>
                        Monitor sensor status and environmental readings.
                    </p>
                </div>
            </section>

            <section className="device-summary" aria-label="Sensors summary">
                <article className="summary-card">
                    <span className="summary-label">Total sensors</span>
                    <strong>{isLoading ? "—" : sensors.length}</strong>
                </article>

                <article className="summary-card">
                    <span className="summary-label">Online</span>
                    <strong>{isLoading ? "—" : onlineCount}</strong>
                </article>

                <article className="summary-card">
                    <span className="summary-label">Offline / Error</span>
                    <strong>{isLoading ? "—" : attentionCount}</strong>
                </article>
            </section>

            <section className="sensors-page-section">
                <div className="devices-section-header">
                    <div>
                        <h2>Registered sensors</h2>
                        <p>Current status and latest readings</p>
                    </div>

                    <button
                        type="button"
                        className="refresh-button"
                        onClick={() => setRefreshKey((current) => current + 1)}
                        disabled={isLoading}
                    >
                        {isLoading ? "Loading..." : "Refresh"}
                    </button>
                </div>

                {isLoading && (
                    <p className="devices-feedback" role="status">
                        Loading sensors...
                    </p>
                )}

                {!isLoading && errorMessage && (
                    <div className="devices-feedback devices-error" role="alert">
                        <p>{errorMessage}</p>

                        <button
                            type="button"
                            className="refresh-button"
                            onClick={() => setRefreshKey((current) => current + 1)}
                        >
                            Try again
                        </button>
                    </div>
                )}

                {!isLoading && !errorMessage && sensors.length === 0 && (
                    <p className="devices-feedback">
                        No sensors registered for this device yet.
                    </p>
                )}

                {!isLoading && !errorMessage && sensors.length > 0 && (
                    <div className="sensors-overview sensors-page-grid">
                        <div className="sensors-overview-row">
                            {sensors.map((sensor) => (
                                <SensorOverviewCard
                                    key={sensor.id}
                                    sensor={sensor}
                                    deviceId={deviceId}
                                    alert={environmentalAlerts.find(
                                        (item) => item.sensorId === sensor.id
                                    )}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </section>
        </main>
    );
}
