
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { getActuatorsByDevice } from "../api/actuator";

import type { Actuator, ActuatorType } from "../types/Actuator";

import fanIcon from "../assets/icons/fan.svg";
import growLightIcon from "../assets/icons/bulb.svg";
import waterPumpIcon from "../assets/icons/water-pump.svg";

const REFRESH_INTERVAL = 5000;

const actuatorLabels: Record<ActuatorType, string> = {
    WATER_PUMP: "Water pump",
    VENTILATION_FAN: "Ventilation fan",
    GROW_LIGHT: "Grow light",
};

const actuatorIcons: Record<ActuatorType, string> = {
    WATER_PUMP: waterPumpIcon,
    VENTILATION_FAN: fanIcon,
    GROW_LIGHT: growLightIcon,
};

export default function ActuatorDetailPage() {
    const { id, actuatorId } = useParams();

    const deviceId = Number(id);
    const parsedActuatorId = Number(actuatorId);

    const [actuator, setActuator] = useState<Actuator | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [refreshKey, setRefreshKey] = useState(0);

    useEffect(() => {
        if (
            !Number.isInteger(deviceId) ||
            deviceId <= 0 ||
            !Number.isInteger(parsedActuatorId) ||
            parsedActuatorId <= 0
        ) {
            setErrorMessage("Invalid device or actuator ID.");
            setIsLoading(false);
            return;
        }

        let cancelled = false;
        let requestInProgress = false;

        async function loadActuatorData(showLoading = false) {
            if (requestInProgress) return;

            requestInProgress = true;

            if (showLoading) {
                setIsLoading(true);
            }

            try {
                const actuatorData = await getActuatorsByDevice(deviceId);

                if (cancelled) return;

                const selectedActuator = actuatorData.find(
                    (item) => item.id === parsedActuatorId
                );

                if (!selectedActuator) {
                    setActuator(null);
                    setErrorMessage("Actuator not found for this device.");
                    return;
                }

                setActuator(selectedActuator);
                setErrorMessage(null);
            } catch (error) {
                if (cancelled) return;

                console.error("Couldn't load actuator details", error);

                setErrorMessage(
                    "Unable to load actuator details. Please check your connection and try again."
                );
            } finally {
                requestInProgress = false;

                if (!cancelled && showLoading) {
                    setIsLoading(false);
                }
            }
        }

        void loadActuatorData(true);

        const intervalId = window.setInterval(() => {
            void loadActuatorData();
        }, REFRESH_INTERVAL);

        return () => {
            cancelled = true;
            window.clearInterval(intervalId);
        };
    }, [deviceId, parsedActuatorId, refreshKey]);

    if (isLoading) {
        return (
            <main className="homepage actuator-detail-page page">
                <p className="devices-feedback" role="status">
                    Loading actuator details...
                </p>
            </main>
        );
    }

    if (errorMessage || !actuator) {
        return (
            <main className="homepage actuator-detail-page page">
                <Link
                    to={`/devices/${deviceId}/actuators`}
                    className="actuator-back-link"
                >
                    ← Back to actuators
                </Link>

                <div className="actuator-detail-feedback">
                    <p className="devices-feedback" role="alert">
                        {errorMessage ?? "Actuator not found."}
                    </p>

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

    return (
        <main className="homepage actuator-detail-page page">
            <Link
                to={`/devices/${deviceId}/actuators`}
                className="actuator-back-link"
            >
                ← Back to actuators
            </Link>

            <section className="actuator-detail-header">
                <div className="actuator-detail-title">
                    <img
                        src={actuatorIcons[actuator.type]}
                        alt=""
                        className="actuator-detail-icon"
                    />

                    <div>
                        <span className="actuator-detail-eyebrow">
                            GREENHOUSE / DEVICE / ACTUATORS
                        </span>

                        <h1>{actuator.name}</h1>

                        <p>{actuatorLabels[actuator.type]}</p>
                    </div>
                </div>

                <button
                    type="button"
                    className="refresh-button"
                    onClick={() => setRefreshKey((current) => current + 1)}
                >
                    Refresh
                </button>
            </section>

            <section className="actuator-detail-summary">
                <article className="actuator-detail-card">
                    <span className="actuator-detail-label">
                        Current state
                    </span>

                    <strong
                        className={`actuator-detail-state actuator-state-${actuator.state.toLowerCase()}`}
                    >
                        {actuator.state}
                    </strong>

                    <p>
                        Current operational state of this actuator.
                    </p>
                </article>

                <article className="actuator-detail-card">
                    <span className="actuator-detail-label">
                        Control mode
                    </span>

                    <strong className="actuator-detail-mode">
                        {actuator.controlMode}
                    </strong>

                    <p>
                        {actuator.controlMode === "AUTO"
                            ? "The actuator is managed automatically by the system."
                            : "The actuator is configured for manual control."}
                    </p>
                </article>
            </section>

            <section className="actuator-detail-information">
                <div>
                    <h2>Actuator information</h2>
                    <p>Identification and configuration details</p>
                </div>

                <dl className="actuator-detail-data">
                    <div>
                        <dt>Actuator ID</dt>
                        <dd>{actuator.id}</dd>
                    </div>

                    <div>
                        <dt>Device ID</dt>
                        <dd>{actuator.deviceId}</dd>
                    </div>

                    <div>
                        <dt>Name</dt>
                        <dd>{actuator.name}</dd>
                    </div>

                    <div>
                        <dt>Type</dt>
                        <dd>{actuatorLabels[actuator.type]}</dd>
                    </div>
                </dl>
            </section>
        </main>
    );
}
