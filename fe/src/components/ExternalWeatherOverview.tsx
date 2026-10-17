
import { useEffect, useState } from "react";
import thermometerIcon from "../assets/icons/thermometer.svg";
import humidityDrop from "../assets/icons/humidity-drop.svg";
import cloudSun from "../assets/icons/cloud-sun.svg";
import { getExternalWeather } from "../api/weather";
import type { ExternalWeather } from "../types/ExternalWeather";

const WEATHER_REFRESH_INTERVAL = 60 * 1000;

export default function ExternalWeatherOverview() {
    const [weather, setWeather] = useState<ExternalWeather | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;

        async function loadWeather() {
            try {
                const data = await getExternalWeather();

                if (!isMounted) {
                    return;
                }

                setWeather(data);
                setError(null);
            } catch {
                if (!isMounted) {
                    return;
                }

                setError("Failed to load external weather.");
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        }

        void loadWeather();

        const intervalId = window.setInterval(() => {
            void loadWeather();
        }, WEATHER_REFRESH_INTERVAL);

        return () => {
            isMounted = false;
            window.clearInterval(intervalId);
        };
    }, []);

    const lastUpdate = weather
        ? new Intl.DateTimeFormat("it-IT", {
              dateStyle: "medium",
              timeStyle: "short"
          }).format(new Date(weather.receivedAt))
        : null;

    const weatherSource =
        weather?.source === "OPEN_METEO"
            ? "Open-Meteo"
            : weather?.source === "FALLBACK"
              ? "Local fallback"
              : null;

    return (
        <div className="external-weather-overview-container">
            <div className="conditions-row">
                <img src={cloudSun} alt="" />
                <h2>External Weather</h2>
            </div>

            <div className="br"></div>

            {loading && !weather && (
                <p>Loading external weather...</p>
            )}

            {!loading && !weather && !error && (
                <p>No weather data available yet.</p>
            )}

            {weather && (
                <>
                    <div className="conditions-row">
                        <img src={thermometerIcon} alt="" />
                        <div className="conditions-row-text">
                            <h3>{weather.temperature.toFixed(1)}°C</h3>
                            <span>Temperature</span>
                        </div>
                    </div>

                    <div className="conditions-row">
                        <img src={humidityDrop} alt="" />
                        <div className="conditions-row-text">
                            <h3>{weather.humidity.toFixed(0)}%</h3>
                            <span>Humidity</span>
                        </div>
                    </div>

                    <div className="br"></div>

                    <span className="conditions-last-update">
                        Last update: {lastUpdate}
                    </span>

                    <p>Source: {weatherSource}</p>
                </>
            )}

            {error && (
                <p role="alert">
                    {weather
                        ? "Unable to refresh weather data. Showing the last available values."
                        : error}
                </p>
            )}
        </div>
    );
}
