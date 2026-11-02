
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import ActuatorsOverview from "../components/ActuatorsOverview";
import { getActuatorsByDevice } from "../api/actuator";

import type { Actuator } from "../types/Actuator";

const REFRESH_INTERVAL = 5000;

export default function ActuatorsPage() {
    const { id } = useParams();
    const deviceId = Number(id);

    const [actuators, setActuators] = useState<Actuator[]>([]);
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

        async function loadActuators(showLoading = false) {
            if (requestInProgress) return;

            requestInProgress = true;

            if (showLoading) {
                setIsLoading(true);
            }

            try {
                const data = await getActuatorsByDevice(deviceId);

                if (cancelled) return;

                setActuators(data);
                setErrorMessage(null);
            } catch (error) {
                if (cancelled) return;

                console.error("Couldn't load actuators", error);

                setErrorMessage(
                    "Unable to load actuators. Please check your connection and try again."
                );
            } finally {
                requestInProgress = false;

                if (!cancelled && showLoading) {
                    setIsLoading(false);
                }
            }
        }

        void loadActuators(true);

        const intervalId = window.setInterval(() => {
            void loadActuators();
        }, REFRESH_INTERVAL);

        return () => {
            cancelled = true;
            window.clearInterval(intervalId);
        };
    }, [deviceId, refreshKey]);

    const onCount = actuators.filter(
        (actuator) => actuator.state === "ON"
    ).length;

    const offCount = actuators.filter(
        (actuator) => actuator.state === "OFF"
    ).length;

    return (
        <main className="homepage actuators-page page">
            <section className="homepage-header">
                <div>
                    <span className="homepage-eyebrow">
                        GREENHOUSE / DEVICE / ACTUATORS
                    </span>

                    <h1>Actuators</h1>

                    <p>
                        Monitor actuator states and automatic control modes.
                    </p>
                </div>
            </section>

            <section className="device-summary" aria-label="Actuators summary">
                <article className="summary-card">
                    <span className="summary-label">Total actuators</span>
                    <strong>{isLoading ? "—" : actuators.length}</strong>
                </article>

                <article className="summary-card">
                    <span className="summary-label">ON</span>
                    <strong>{isLoading ? "—" : onCount}</strong>
                </article>

                <article className="summary-card">
                    <span className="summary-label">OFF</span>
                    <strong>{isLoading ? "—" : offCount}</strong>
                </article>
            </section>

            <section className="actuators-page-section">
                <div className="actuators-page-section-header">
                    <div>
                        <h2>Registered actuators</h2>
                        <p>Current state and control mode</p>
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
                        Loading actuators...
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

                {!isLoading && !errorMessage && actuators.length === 0 && (
                    <p className="devices-feedback">
                        No actuators registered for this device yet.
                    </p>
                )}

                {!isLoading && !errorMessage && actuators.length > 0 && (
                    <div className="actuators-page-list">
                        <ActuatorsOverview actuators={actuators} />
                    </div>
                )}
            </section>
        </main>
    );
}
