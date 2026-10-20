import { useCallback, useEffect, useState } from "react";
import { fetchDeviceList } from "../api/device";
import DeviceCard from "../components/DeviceCard";
import type { Device } from "../types/Device";

export default function HomePage() {
    const [deviceList, setDeviceList] = useState<Device[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const loadDevices = useCallback(async () => {
        setIsLoading(true);
        setErrorMessage(null);

        try {
            const data = await fetchDeviceList();
            setDeviceList(data);
        } catch (error) {
            console.error("Couldn't load devices", error);
            setErrorMessage(
                "Unable to load devices. Please check your connection and try again."
            );
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadDevices();
    }, [loadDevices]);

    const onlineCount = deviceList.filter(
        (device) => device.status === "ONLINE"
    ).length;

    const attentionCount = deviceList.filter(
        (device) => device.status === "OFFLINE" || device.status === "ERROR"
    ).length;

    return (
        <main className="homepage page">
            <section className="homepage-header">
                <div>
                    <span className="homepage-eyebrow">GREENHOUSE / DEVICES</span>
                    <h1>Devices Overview</h1>
                    <p>Monitor and manage your greenhouse devices.</p>
                </div>
            </section>

            <section className="device-summary" aria-label="Devices summary">
                <article className="summary-card">
                    <span className="summary-label">Total devices</span>
                    <strong>{isLoading ? "—" : deviceList.length}</strong>
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

            <section className="devices-section">
                <div className="devices-section-header">
                    <div>
                        <h2>Registered devices</h2>
                        <p>Your greenhouse infrastructure</p>
                    </div>

                    <button
                        type="button"
                        className="refresh-button"
                        onClick={() => void loadDevices()}
                        disabled={isLoading}
                    >
                        {isLoading ? "Loading..." : "Refresh"}
                    </button>
                </div>

                {isLoading && (
                    <p className="devices-feedback" role="status">
                        Loading devices...
                    </p>
                )}

                {!isLoading && errorMessage && (
                    <div className="devices-feedback devices-error" role="alert">
                        <p>{errorMessage}</p>
                        <button
                            type="button"
                            className="refresh-button"
                            onClick={() => void loadDevices()}
                        >
                            Try again
                        </button>
                    </div>
                )}

                {!isLoading && !errorMessage && deviceList.length === 0 && (
                    <p className="devices-feedback">
                        No devices registered yet.
                    </p>
                )}

                {!isLoading && !errorMessage && deviceList.length > 0 && (
                    <div className="devices-list">
                        {deviceList.map((device) => (
                            <DeviceCard key={device.id} {...device} />
                        ))}
                    </div>
                )}
            </section>
        </main>
    );
}