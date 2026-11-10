import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
    CartesianGrid,
    Legend,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
 
import { getSensorsByDevice, getReadingsAggregate } from "../api/sensor";
 
import type { Sensor, SensorType } from "../types/Sensor";
import type { ReadingAggregatePoint } from "../types/Reading";
 
import "../App.scss";
 
const REFRESH_INTERVAL = 60_000;
 
type TimeRange = "24h" | "7d" | "all";
 
interface SensorTrend {
    sensor: Sensor;
    points: ReadingAggregatePoint[];
}
 
interface TrendChartPoint {
    timestamp: number;
    time: string;
    [key: string]: string | number | null;
}
 
const sensorTypes: SensorType[] = [
    "TEMPERATURE",
    "HUMIDITY",
    "SOIL_MOISTURE",
    "LIGHT",
];
 
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
 
const chartColors = [
    "#4f7c59",
    "#3f78a8",
    "#c58a3a",
    "#8a65a8",
    "#c45e5e",
    "#4b9b9b",
];
 
function getSensorDataKey(sensorId: number): string {
    return `sensor_${sensorId}`;
}
 
function formatSensorValue(value: number, type: SensorType): string {
    if (type === "LIGHT") {
        return value.toLocaleString("it-IT", {
            maximumFractionDigits: 0,
        });
    }
 
    return value.toFixed(1);
}
 
function formatDate(timestamp: number): string {
    return new Intl.DateTimeFormat("it-IT", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    }).format(timestamp);
}
 
export default function TrendsPage() {
    const { id } = useParams();
    const deviceId = Number(id);
 
    const [sensorTrends, setSensorTrends] = useState<SensorTrend[]>([]);
    const [timeRange, setTimeRange] = useState<TimeRange>("24h");
    const [isLoading, setIsLoading] = useState(true);
    const [isRangeLoading, setIsRangeLoading] = useState(false);
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
        let isFirstLoad = true;
 
        // The backend returns readings aggregated into time buckets, so every
        // range stays small. Charts refresh once a minute.
        async function loadTrendData() {
            if (requestInProgress) return;
 
            requestInProgress = true;
 
            const showLoading = isFirstLoad;
 
            if (showLoading) {
                setIsRangeLoading(true);
            }
 
            try {
                const sensors = await getSensorsByDevice(deviceId);
 
                const trends = await Promise.all(
                    sensors.map(async (sensor) => ({
                        sensor,
                        points: (
                            await getReadingsAggregate(sensor.id, timeRange)
                        ).points,
                    }))
                );
 
                if (cancelled) return;
 
                setSensorTrends(trends);
                setErrorMessage(null);
                isFirstLoad = false;
            } catch (error) {
                if (cancelled) return;
 
                console.error("Couldn't load environmental trends", error);
 
                setErrorMessage(
                    "Unable to load environmental trends. Please check your connection and try again."
                );
            } finally {
                requestInProgress = false;
 
                if (!cancelled) {
                    setIsLoading(false);
 
                    if (showLoading) {
                        setIsRangeLoading(false);
                    }
                }
            }
        }
 
        void loadTrendData();
 
        const intervalId = window.setInterval(() => {
            void loadTrendData();
        }, REFRESH_INTERVAL);
 
        return () => {
            cancelled = true;
            window.clearInterval(intervalId);
        };
    }, [deviceId, timeRange, refreshKey]);
 
    const totalReadings = sensorTrends.reduce(
        (total, item) =>
            total +
            item.points.reduce((sum, point) => sum + point.count, 0),
        0
    );
 
    function buildChartData(
        trends: SensorTrend[]
    ): TrendChartPoint[] {
        const pointsByTimestamp = new Map<number, TrendChartPoint>();
 
        trends.forEach(({ sensor, points }) => {
            points.forEach((sample) => {
                const timestamp = new Date(sample.timestamp).getTime();
 
                let point = pointsByTimestamp.get(timestamp);
 
                if (!point) {
                    point = {
                        timestamp,
                        time: formatDate(timestamp),
                    };
 
                    pointsByTimestamp.set(timestamp, point);
                }
 
                point[getSensorDataKey(sensor.id)] = sample.avg;
            });
        });
 
        return Array.from(pointsByTimestamp.values()).sort(
            (a, b) => a.timestamp - b.timestamp
        );
    }
 
    if (isLoading) {
        return (
            <main className="homepage trends-page page">
                <p className="devices-feedback" role="status">
                    Loading environmental trends...
                </p>
            </main>
        );
    }
 
    if (errorMessage && sensorTrends.length === 0) {
        return (
            <main className="homepage trends-page page">
                <Link
                    to={`/devices/${deviceId}`}
                    className="trends-back-link"
                >
                    ← Back to dashboard
                </Link>
 
                <section className="trends-feedback">
                    <p role="alert">{errorMessage}</p>
 
                    <button
                        type="button"
                        onClick={() => setRefreshKey((current) => current + 1)}
                    >
                        Try again
                    </button>
                </section>
            </main>
        );
    }
 
    return (
        <main className="homepage trends-page page">
            <header className="trends-page-header">
                <div>
                    <Link
                        to={`/devices/${deviceId}`}
                        className="trends-back-link"
                    >
                        ← Back to dashboard
                    </Link>
 
                    <h1>Environmental trends</h1>
 
                    <p>
                        Historical measurements from the device sensors.
                    </p>
                </div>
 
                <button
                    type="button"
                    className="trends-refresh-button"
                    onClick={() => setRefreshKey((current) => current + 1)}
                >
                    Refresh
                </button>
            </header>
 
            {errorMessage && (
                <p className="trends-inline-error" role="alert">
                    {errorMessage}
                </p>
            )}
 
            <section className="trends-summary">
                <div className="trends-summary-card">
                    <span>Monitoring sensors</span>
                    <strong>{sensorTrends.length}</strong>
                </div>
 
                <div className="trends-summary-card">
                    <span>Historical readings</span>
                    <strong>{totalReadings.toLocaleString("it-IT")}</strong>
                </div>
            </section>
 
            <section className="trends-controls">
                <div>
                    <h2>Time range</h2>
                    <p>Choose the period displayed in the charts.</p>
                </div>
 
                <select
                    aria-label="Select trends time range"
                    value={timeRange}
                    onChange={(event) =>
                        setTimeRange(event.target.value as TimeRange)
                    }
                >
                    <option value="24h">Last 24 hours</option>
                    <option value="7d">Last 7 days</option>
                    <option value="all">All readings</option>
                </select>
 
                {isRangeLoading && (
                    <p className="trend-reading-count" role="status">
                        Updating...
                    </p>
                )}
 
            </section>
 
            <div className="trends-chart-grid">
                {sensorTypes.map((type) => {
                    const trendsForType = sensorTrends.filter(
                        (item) => item.sensor.type === type
                    );
 
                    const chartData = buildChartData(trendsForType);
 
                    const readingCount = trendsForType.reduce(
                        (total, item) =>
                            total +
                            item.points.reduce(
                                (sum, point) => sum + point.count,
                                0
                            ),
                        0
                    );
 
                    return (
                        <section
                            className="trends-chart-card"
                            key={type}
                        >
                            <header className="trends-chart-card-header">
                                <div>
                                    <h2>{sensorLabels[type]}</h2>
                                    <p>
                                        Historical data · {sensorUnits[type]}
                                    </p>
                                </div>
 
                                <span className="trends-chart-count">
                                    {readingCount.toLocaleString("it-IT")} readings
                                </span>
                            </header>
 
                            {trendsForType.length === 0 ? (
                                <p className="devices-feedback">
                                    No sensors of this type are available.
                                </p>
                            ) : readingCount === 0 ? (
                                <p className="devices-feedback">
                                    No readings available for the selected time
                                    range.
                                </p>
                            ) : (
                                <>
                                    <div className="trends-chart">
                                        <ResponsiveContainer
                                            width="100%"
                                            height="100%"
                                        >
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
                                                    width={60}
                                                />
 
                                                <Tooltip
                                                    labelFormatter={(_, payload) => {
                                                        const timestamp =
                                                            payload?.[0]?.payload
                                                                ?.timestamp;
 
                                                        return typeof timestamp === "number"
                                                            ? formatDate(timestamp)
                                                            : "";
                                                    }}
                                                    formatter={(value, name) => [
                                                        `${value} ${sensorUnits[type]}`,
                                                        name,
                                                    ]}
                                                />
 
                                                {trendsForType.map(
                                                    ({ sensor }, index) => (
                                                        <Line
                                                            key={sensor.id}
                                                            type="monotone"
                                                            dataKey={getSensorDataKey(
                                                                sensor.id
                                                            )}
                                                            name={sensor.name}
                                                            stroke={
                                                                chartColors[
                                                                    index %
                                                                        chartColors.length
                                                                ]
                                                            }
                                                            strokeWidth={2}
                                                            dot={false}
                                                            activeDot={{ r: 4 }}
                                                            connectNulls={false}
                                                        />
                                                    )
                                                )}
 
                                                {trendsForType.length > 1 && (
                                                    <Legend />
                                                )}
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
 
                                    <div className="trends-latest-readings">
                                        {trendsForType.map(({ sensor }) => {
                                            return (
                                                <div
                                                    className="trends-latest-item"
                                                    key={sensor.id}
                                                >
                                                    <span>{sensor.name}</span>
 
                                                    <strong>
                                                        {`${formatSensorValue(
                                                            sensor.currentValue,
                                                            type
                                                        )} ${sensorUnits[type]}`}
                                                    </strong>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </>
                            )}
                        </section>
                    );
                })}
            </div>
        </main>
    );
}