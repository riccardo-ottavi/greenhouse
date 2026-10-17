
import humidityIcon from "../assets/icons/humidity-drop.svg";
import lightIcon from "../assets/icons/sun-light.svg";
import soilMoistureIcon from "../assets/icons/soil-sprout.svg";
import temperatureIcon from "../assets/icons/thermometer.svg";
import type { Sensor, SensorType } from "../types/Sensor";
import type { EnvironmentalAlert } from "../types/EnvironmentalAlert";

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

interface SensorOverviewCardProps {
    sensor: Sensor;
    alert?: EnvironmentalAlert;
}

function formatLastUpdate(lastUpdate: string | null): string {
    if (!lastUpdate) return "No update available";

    const date = new Date(lastUpdate);
    if (Number.isNaN(date.getTime())) return "Update time unavailable";

    return new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(date);
}

export default function SensorOverviewCard({
    sensor,
    alert,
}: SensorOverviewCardProps) {
    const value = sensor.type === "LIGHT"
        ? sensor.currentValue.toLocaleString(undefined, {
            maximumFractionDigits: 0,
        })
        : sensor.currentValue.toFixed(1);

    return (
        <article className="sensor-overview-card">
            <div className="sensor-card-header">
                <img src={sensorIcons[sensor.type]} alt="" />
                <span
                    className={`sensor-status sensor-status-${sensor.status.toLowerCase()}`}
                >
                    {sensor.status}
                </span>
            </div>

            <div className="sensor-card-reading">
                <span className="sensor-card-type">
                    {sensor.type.replaceAll("_", " ")}
                </span>

                <strong>
                    {value}
                    <span>{sensorUnits[sensor.type]}</span>
                </strong>

                <h4>{sensor.name}</h4>
            </div>

            {alert && (
                <div className="sensor-alert">
                    <span className="sensor-alert-indicator">!</span>
                    <span>{alertMessages[alert.type]}</span>
                </div>
            )}

            <div className="sensor-card-footer">
                <span>Updated {formatLastUpdate(sensor.lastUpdate)}</span>
                <span>Every {sensor.samplingInterval}s</span>
            </div>
        </article>
    );
}
