import { useEffect, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { getReadingsBySensor } from "../api/sensor";
import type { Reading } from "../types/Reading";
import type { Sensor } from "../types/Sensor";

interface TrendOverviewProps {
  sensors: Sensor[];
}

export default function TrendOverview({
  sensors,
}: TrendOverviewProps) {
  const [selectedSensorId, setSelectedSensorId] =
    useState<number | null>(sensors[0]?.id ?? null);

  const [readings, setReadings] = useState<Reading[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (selectedSensorId === null) {
      setReadings([]);
      return;
    }

    let cancelled = false;

    async function loadReadings() {
      setLoading(true);
      setError(null);

      try {
        const data = await getReadingsBySensor(selectedSensorId!);

        if (!cancelled) {
          setReadings(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load readings"
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadReadings();

    return () => {
      cancelled = true;
    };
  }, [selectedSensorId]);

  const selectedSensor = sensors.find(
    (sensor) => sensor.id === selectedSensorId
  );

  const chartData = [...readings]
    .sort(
      (a, b) =>
        new Date(a.timestamp).getTime() -
        new Date(b.timestamp).getTime()
    )
    .map((reading) => ({
      ...reading,
      time: new Date(reading.timestamp).toLocaleTimeString(
        "it-IT",
        {
          hour: "2-digit",
          minute: "2-digit",
        }
      ),
    }));

  return (
    <section className="trend-overview">
      <div className="trend-overview-header">
        <div>
          <h3>Trend overview</h3>
          <span>Environmental readings over time</span>
        </div>

        <select
          aria-label="Select sensor"
          value={selectedSensorId ?? ""}
          onChange={(event) =>
            setSelectedSensorId(
              event.target.value
                ? Number(event.target.value)
                : null
            )
          }
        >
          {sensors.map((sensor) => (
            <option key={sensor.id} value={sensor.id}>
              {sensor.name}
            </option>
          ))}
        </select>
      </div>

      {loading && <p>Loading readings...</p>}

      {error && <p role="alert">{error}</p>}

      {!loading && !error && sensors.length === 0 && (
        <p>No sensors available.</p>
      )}

      {!loading &&
        !error &&
        sensors.length > 0 &&
        readings.length === 0 && (
          <p>No readings available for this sensor yet.</p>
        )}

      {!loading && !error && readings.length > 0 && (
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
                  tick={{ fontSize: 12 }}
                />

                <YAxis
                  domain={["auto", "auto"]}
                  tick={{ fontSize: 12 }}
                  width={45}
                />

                <Tooltip
                  labelFormatter={(label) => `Time: ${label}`}
                  formatter={(value) => [
                    `${value} ${selectedSensor?.type === "TEMPERATURE"
                      ? "°C"
                      : selectedSensor?.type === "LIGHT"
                        ? "lux"
                        : "%"}`,
                    selectedSensor?.name ?? "Value",
                  ]}
                />

                <Line
                  type="monotone"
                  dataKey="value"
                  name={selectedSensor?.name ?? "Value"}
                  stroke="#4f7c59"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <p className="trend-reading-count">
            {readings.length} readings
          </p>
        </>
      )}
    </section>
  );
}