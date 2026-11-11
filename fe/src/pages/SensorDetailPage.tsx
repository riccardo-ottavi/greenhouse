import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
    CartesianGrid,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
 
import { getSensorsByDevice, getReadingsAggregate } from "../api/sensor";
import { getActiveEnvironmentalAlerts } from "../api/environmentalAlert";
 
import type { Sensor, SensorType } from "../types/Sensor";
import type { ReadingAggregate } from "../types/Reading";
import type { EnvironmentalAlert } from "../types/EnvironmentalAlert";
 
const REFRESH_INTERVAL = 5000;
const CHART_REFRESH_INTERVAL = 60_000;
 
type TimeRange = "24h" | "7d" | "all";
 
const sensorLabels: Record<SensorType, string> = {
    TEMPERATURE: "Temperature",
    HUMIDITY: "Humidity",
    SOIL_MOISTURE: "Soil moisture",
    LIGHT: "Light",
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
 
function formatDate(dateString: string | null): string {
    if (!dateString) return "Not available";
 
    const date = new Date(dateString);
 
    if (Number.isNaN(date.getTime())) {
        return "Not available";
    }
 
    return new Intl.DateTimeFormat("it-IT", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(date);
}
 
function formatBucket(seconds: number): string {
    if (seconds < 3600) return `${Math.round(seconds / 60)} min`;
    if (seconds < 86400) return `${Math.round(seconds / 3600)} h`;
 
    return `${Math.round(seconds / 86400)} d`;
}
 
function formatSensorValue(value: number, type: SensorType): string {
    if (type === "LIGHT") {
        return value.toLocaleString("it-IT", {
            maximumFractionDigits: 0,
        });
    }
 
    return value.toFixed(1);
}
 
export default function SensorDetailPage() {
    const { id, sensorId } = useParams();
 
    const deviceId = Number(id);
    const parsedSensorId = Number(sensorId);
 
    const [sensor, setSensor] = useState<Sensor | null>(null);
    const [aggregate, setAggregate] = useState<ReadingAggregate | null>(null);
    const [activeAlert, setActiveAlert] =
        useState<EnvironmentalAlert | null>(null);
 
    const [timeRange, setTimeRange] = useState<TimeRange>("24h");
    const [isLoading, setIsLoading] = useState(true);
    const [isHistoryLoading, setIsHistoryLoading] = useState(true);
    const [historyError, setHistoryError] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [refreshKey, setRefreshKey] = useState(0);
 
    useEffect(() => {
        if (
            !Number.isInteger(deviceId) ||
            deviceId <= 0 ||
            !Number.isInteger(parsedSensorId) ||
            parsedSensorId <= 0
        ) {
            setErrorMessage("Invalid device or sensor ID.");
            setIsLoading(false);
            return;
        }
 
        let cancelled = false;
        let requestInProgress = false;
 
        async function loadSensorData(showLoading = false) {
            if (requestInProgress) return;
 
            requestInProgress = true;
 
            if (showLoading) {
                setIsLoading(true);
            }
 
            try {
                const [sensorData, alertData] =
                    await Promise.all([
                        getSensorsByDevice(deviceId),
                        getActiveEnvironmentalAlerts(),
                    ]);
 
                if (cancelled) return;
 
                const selectedSensor = sensorData.find(
                    (item) => item.id === parsedSensorId
                );
 
                if (!selectedSensor) {
                    setSensor(null);
                    setActiveAlert(null);
                    setErrorMessage("Sensor not found for this device.");
                    return;
                }
 
                setSensor(selectedSensor);
 
                setActiveAlert(
                    alertData.find(
                        (alert) => alert.sensorId === parsedSensorId
                    ) ?? null
                );
 
                setErrorMessage(null);
            } catch (error) {
                if (cancelled) return;
 
                console.error("Couldn't load sensor details", error);
 
                setErrorMessage(
                    "Unable to load sensor details. Please check your connection and try again."
                );
            } finally {
                requestInProgress = false;
 
                if (!cancelled && showLoading) {
                    setIsLoading(false);
                }
            }
        }
 
        void loadSensorData(true);
 
        const intervalId = window.setInterval(() => {
            void loadSensorData();
        }, REFRESH_INTERVAL);
 
        return () => {
            cancelled = true;
            window.clearInterval(intervalId);
        };
    }, [deviceId, parsedSensorId, refreshKey]);
 
    // Reading history: the backend returns readings already aggregated into
    // time buckets, so any range stays small. Charts refresh once a minute.
    useEffect(() => {
        if (!Number.isInteger(parsedSensorId) || parsedSensorId <= 0) {
            return;
        }
 
        let cancelled = false;
        let requestInProgress = false;
        let isFirstLoad = true;
 
        async function loadAggregate() {
            if (requestInProgress) return;
 
            requestInProgress = true;
 
            const showLoading = isFirstLoad;
 
            if (showLoading) {
                setIsHistoryLoading(true);
            }
 
            try {
                const data = await getReadingsAggregate(
                    parsedSensorId,
                    timeRange
                );
 
                if (cancelled) return;
 
                setAggregate(data);
                setHistoryError(null);
                isFirstLoad = false;
            } catch (error) {
                if (cancelled) return;
 
                console.error("Couldn't load reading history", error);
 
                setHistoryError("Unable to load reading history.");
            } finally {
                requestInProgress = false;
 
                if (!cancelled && showLoading) {
                    setIsHistoryLoading(false);
                }
            }
        }
 
        void loadAggregate();
 
        const intervalId = window.setInterval(() => {
            void loadAggregate();
        }, CHART_REFRESH_INTERVAL);
 
        return () => {
            cancelled = true;
            window.clearInterval(intervalId);
        };
    }, [parsedSensorId, timeRange, refreshKey]);
 
    const points = aggregate?.points ?? [];
 
    const chartData = points.map((point) => ({
        value: point.avg,
        timestamp: new Date(point.timestamp).getTime(),
        time: new Date(point.timestamp).toLocaleString("it-IT", {
            day: "2-digit",
            month: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
        }),
    }));
 
    const summarizedReadings = points.reduce(
        (total, point) => total + point.count,
        0
    );
 
    if (isLoading) {
        return (
            <main className="homepage sensor-detail-page page">
                <p className="devices-feedback" role="status">
                    Loading sensor details...
                </p>
            </main>
        );
    }
 
    if (errorMessage || !sensor) {
        return (
            <main className="homepage sensor-detail-page page">
                <Link
                    to={`/devices/${deviceId}/sensors`}
                    className="sensor-back-link"
                >
                    ← Back to sensors
                </Link>
 
                <div className="devices-feedback devices-error" role="alert">
                    <p>{errorMessage ?? "Sensor not found."}</p>
 
                    <button
                        type="button"
                        className="refresh-button"
                        onClick={() => setRefreshKey((current) => current + 1)}
                    >
                        Try again
                    </button>
                </div>
            </main>
        );
    }
 
    const unit = sensorUnits[sensor.type];
 
    return (
        <main className="homepage sensor-detail-page page">
            <section className="homepage-header">
                <div>
                    <span className="homepage-eyebrow">
                        GREENHOUSE / DEVICE / SENSORS / DETAIL
                    </span>
 
                    <h1>{sensor.name}</h1>
 
                    <p>{sensorLabels[sensor.type]} sensor details and history.</p>
                </div>
 
                <button
                    type="button"
                    className="refresh-button"
                    onClick={() => setRefreshKey((current) => current + 1)}
                >
                    Refresh
                </button>
            </section>
 
            <Link
                to={`/devices/${deviceId}/sensors`}
                className="sensor-back-link"
            >
                ← Back to sensors
            </Link>
 
            <section className="device-summary sensor-detail-summary">
                <article className="summary-card">
                    <span className="summary-label">Current reading</span>
                    <strong>
                        {formatSensorValue(sensor.currentValue, sensor.type)}
                        <span className="sensor-detail-unit">{unit}</span>
                    </strong>
                </article>
 
                <article className="summary-card">
                    <span className="summary-label">Sensor status</span>
                    <strong
                        className={`sensor-detail-status sensor-detail-status-${sensor.status.toLowerCase()}`}
                    >
                        {sensor.status}
                    </strong>
                </article>
 
                <article className="summary-card">
                    <span className="summary-label">Sampling interval</span>
                    <strong>{sensor.samplingInterval}s</strong>
                </article>
            </section>
 
            <section className="sensor-detail-information">
                <div>
                    <span>Sensor type</span>
                    <strong>{sensorLabels[sensor.type]}</strong>
                </div>
 
                <div>
                    <span>Sensor ID</span>
                    <strong>#{sensor.id}</strong>
                </div>
 
                <div>
                    <span>Zone ID</span>
                    <strong>#{sensor.zoneId}</strong>
                </div>
 
                <div>
                    <span>Last update</span>
                    <strong>{formatDate(sensor.lastUpdate)}</strong>
                </div>
            </section>
 
            {activeAlert && (
                <section className="sensor-detail-alert" role="status">
                    <strong>{alertMessages[activeAlert.type]}</strong>
 
                    <span>
                        Triggered value:{" "}
                        {formatSensorValue(
                            activeAlert.triggeredValue,
                            sensor.type
                        )}{" "}
                        {unit}
                    </span>
 
                    <span>
                        Triggered at: {formatDate(activeAlert.triggeredAt)}
                    </span>
                </section>
            )}
 
            <section className="sensor-detail-chart-section">
                <div className="sensor-detail-chart-header">
                    <div>
                        <h2>Reading history</h2>
                        <p>Historical measurements from this sensor</p>
                    </div>
 
                    <select
                        aria-label="Select history time range"
                        value={timeRange}
                        onChange={(event) =>
                            setTimeRange(event.target.value as TimeRange)
                        }
                    >
                        <option value="24h">Last 24 hours</option>
                        <option value="7d">Last 7 days</option>
                        <option value="all">All readings</option>
                    </select>
                </div>
 
                {historyError && (
                    <p className="trends-inline-error" role="alert">
                        {historyError}
                    </p>
                )}
 
                {isHistoryLoading ? (
                    <p className="devices-feedback" role="status">
                        Loading readings...
                    </p>
                ) : chartData.length === 0 ? (
                    <p className="devices-feedback">
                        No readings available for the selected time range.
                    </p>
                ) : (
                    <>
                        <div className="trend-chart">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart
                                    data={chartData}
                                    margin={{
                                        top: 10,
                                        right: 20,
                                        left: 0,
                                        bottom: 5,
                                    }}
                                >
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        stroke="#d9ded8"
                                    />
 
                                    <XAxis
                                        dataKey="time"
                                        tick={{ fontSize: 11 }}
                                        minTickGap={25}
                                    />
 
                                    <YAxis
                                        domain={["auto", "auto"]}
                                        tick={{ fontSize: 12 }}
                                        width={55}
                                    />
 
                                    <Tooltip
                                        labelFormatter={(label) => `Time: ${label}`}
                                        formatter={(value) => [
                                            `${value} ${unit}`,
                                            sensor.name,
                                        ]}
                                    />
 
                                    <Line
                                        type="monotone"
                                        dataKey="value"
                                        name={sensor.name}
                                        stroke="#4f7c59"
                                        strokeWidth={2}
                                        dot={false}
                                        activeDot={{ r: 4 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
 
                        <p className="trend-reading-count">
                            {summarizedReadings.toLocaleString("it-IT")}{" "}
                            readings, averaged over{" "}
                            {formatBucket(aggregate?.bucketSeconds ?? 0)}{" "}
                            intervals
                        </p>
                    </>
                )}
            </section>
        </main>
    );
}