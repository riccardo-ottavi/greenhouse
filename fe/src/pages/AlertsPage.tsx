import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import humidityIcon from "../assets/icons/humidity-drop.svg";
import lightIcon from "../assets/icons/sun-light.svg";
import soilMoistureIcon from "../assets/icons/soil-sprout.svg";
import temperatureIcon from "../assets/icons/thermometer.svg";

import { getActiveEnvironmentalAlerts } from "../api/environmentalAlert";
import { getSensorsByDevice } from "../api/sensor";

import type { EnvironmentalAlert } from "../types/EnvironmentalAlert";
import type { Sensor, SensorType } from "../types/Sensor";

const REFRESH_INTERVAL = 5000;

const sensorIcons: Record<SensorType, string> = {
    TEMPERATURE: temperatureIcon,
    HUMIDITY: humidityIcon,
    SOIL_MOISTURE: soilMoistureIcon,
    LIGHT: lightIcon,
};

const sensorUnits: Record<SensorType, string> = {
    TEMPERATURE: "°C",
    HUMIDITY: "%",
    SOIL_MOISTURE: "%",
    LIGHT: "lux",
};

const alertMessages: Record<EnvironmentalAlert["type"], string> = {
    HIGH_TEMPERATURE: "High temperature",
    HIGH_HUMIDITY: "High humidity",
    LOW_SOIL_MOISTURE: "Low soil moisture",
    LOW_LIGHT: "Insufficient light",
};

function formatTimestamp(value: string | null): string {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "Unknown time";
    }

    return new Intl.DateTimeFormat("it-IT", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(date);
}

function formatSensorValue(value: number, type: SensorType): string {
    if (type === "LIGHT") {
        return value.toLocaleString("it-IT", {
            maximumFractionDigits: 0,
        });
    }

    return value.toFixed(1);
}

export default function AlertsPage() {
    const { id } = useParams();
    const deviceId = Number(id);

    const [sensors, setSensors] = useState<Sensor[]>([]);
    const [alerts, setAlerts] = useState<EnvironmentalAlert[]>([]);
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

        async function loadAlerts(showLoading = false) {
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
                setAlerts(alertData);
                setErrorMessage(null);
            } catch (error) {
                if (cancelled) return;

                console.error("Couldn't load alerts", error);

                setErrorMessage(
                    "Unable to load active alerts. Please check your connection and try again."
                );
            } finally {
                requestInProgress = false;

                if (!cancelled && showLoading) {
                    setIsLoading(false);
                }
            }
        }

        void loadAlerts(true);

        const intervalId = window.setInterval(() => {
            void loadAlerts();
        }, REFRESH_INTERVAL);

        return () => {
            cancelled = true;
            window.clearInterval(intervalId);
        };
    }, [deviceId, refreshKey]);

    const sensorMap = useMemo(
        () => new Map(sensors.map((sensor) => [sensor.id, sensor])),
        [sensors]
    );

    const activeAlertsForDevice = useMemo(
        () =>
            alerts
                .filter((alert) => sensorMap.has(alert.sensorId))
                .map((alert) => ({
                    ...alert,
                    sensor: sensorMap.get(alert.sensorId)!,
                }))
                .sort(
                    (a, b) =>
                        new Date(b.triggeredAt).getTime() -
                        new Date(a.triggeredAt).getTime()
                ),
        [alerts, sensorMap]
    );

    const uniqueSensorCount = new Set(
        activeAlertsForDevice.map((alert) => alert.sensorId)
    ).size;

    const newestAlertTime = activeAlertsForDevice[0]?.triggeredAt ?? null;

    return (
        <main className="homepage alerts-page page">
            <section className="homepage-header">
                <div>
                    <span className="homepage-eyebrow">
                        GREENHOUSE / DEVICE / ALERTS
                    </span>

                    <h1>Alerts</h1>

                    <p>
                        Monitor the active environmental conditions that need attention.
                    </p>
                </div>
            </section>

            <section className="device-summary" aria-label="Alert summary">
                <article className="summary-card">
                    <span className="summary-label">Active alerts</span>
                    <strong>{isLoading ? "—" : activeAlertsForDevice.length}</strong>
                </article>

                <article className="summary-card">
                    <span className="summary-label">Sensors affected</span>
                    <strong>{isLoading ? "—" : uniqueSensorCount}</strong>
                </article>

                <article className="summary-card">
                    <span className="summary-label">Latest trigger</span>
                    <strong>{isLoading ? "—" : formatTimestamp(newestAlertTime)}</strong>
                </article>
            </section>

            <section className="alerts-page-section">
                <div className="devices-section-header">
                    <div>
                        <h2>Current alerts</h2>
                        <p>Latest active warnings for this greenhouse device</p>
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
                        Loading active alerts...
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

                {!isLoading && !errorMessage && activeAlertsForDevice.length === 0 && (
                    <p className="devices-feedback">
                        No active environmental alerts for this device right now.
                    </p>
                )}

                {!isLoading && !errorMessage && activeAlertsForDevice.length > 0 && (
                    <div className="alerts-list">
                        {activeAlertsForDevice.map((alert) => (
                            <article key={alert.id} className="alert-card">
                                <div className="alert-card-header">
                                    <div className="alert-card-title-group">
                                        <img
                                            src={sensorIcons[alert.sensor.type]}
                                            alt=""
                                            className="alert-card-icon"
                                        />

                                        <div className="alert-card-text">
                                            <h3>{alertMessages[alert.type]}</h3>
                                            <span>{alert.sensor.name}</span>
                                        </div>
                                    </div>

                                    <span className="alert-status-badge">ACTIVE</span>
                                </div>

                                <div className="alert-card-body">
                                    <div className="alert-card-meta">
                                        <span className="alert-label">Sensor type</span>
                                        <span className="alert-value">
                                            {alert.sensor.type.replaceAll("_", " ")}
                                        </span>
                                    </div>

                                    <div className="alert-card-meta">
                                        <span className="alert-label">Triggered value</span>
                                        <span className="alert-value">
                                            {formatSensorValue(alert.triggeredValue, alert.sensor.type)}
                                            {" "}
                                            {sensorUnits[alert.sensor.type]}
                                        </span>
                                    </div>
                                </div>

                                <div className="alert-card-footer">
                                    <span>
                                        Triggered {formatTimestamp(alert.triggeredAt)}
                                    </span>

                                    <Link
                                        to={`/devices/${deviceId}/sensors/${alert.sensor.id}`}
                                        className="alert-sensor-link"
                                    >
                                        View sensor
                                    </Link>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </section>
        </main>
    );
}
