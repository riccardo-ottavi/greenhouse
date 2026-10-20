
import { useState } from "react";
import fanIcon from "../assets/icons/fan.svg";
import growLightIcon from "../assets/icons/bulb.svg";
import waterPumpIcon from "../assets/icons/water-pump.svg";
import { sendActuatorCommand } from "../api/actuator";

import type {
    Actuator,
    ActuatorType,
    ActuatorState,
    ControlMode,
} from "../types/Actuator";

const actuatorIcons: Record<ActuatorType, string> = {
    WATER_PUMP: waterPumpIcon,
    VENTILATION_FAN: fanIcon,
    GROW_LIGHT: growLightIcon,
};

interface ActuatorsOverviewProps {
    actuators: Actuator[];
}

type ActuatorFeedback = {
    actuatorId: number;
    message: string;
    isError: boolean;
    expectedState?: ActuatorState;
    expectedControlMode?: ControlMode;
};

export default function ActuatorsOverview({
    actuators,
}: ActuatorsOverviewProps) {
    const [pendingActuators, setPendingActuators] = useState<number[]>([]);
    const [feedback, setFeedback] = useState<ActuatorFeedback | null>(null);

    async function handleStateChange(
        actuatorId: number,
        state: ActuatorState
    ) {
        await executeCommand(actuatorId, {
            type: "SET_ACTUATOR_STATE",
            state,
        });
    }

    async function handleModeChange(
        actuatorId: number,
        controlMode: ControlMode
    ) {
        await executeCommand(actuatorId, {
            type: "SET_CONTROL_MODE",
            controlMode,
        });
    }

    async function executeCommand(
        actuatorId: number,
        command:
            | { type: "SET_ACTUATOR_STATE"; state: ActuatorState }
            | { type: "SET_CONTROL_MODE"; controlMode: ControlMode }
    ) {
        if (pendingActuators.includes(actuatorId)) {
            return;
        }

        setPendingActuators((current) => [...current, actuatorId]);
        setFeedback(null);

        try {
            await sendActuatorCommand(actuatorId, command);

            setFeedback({
                actuatorId,
                message: "Command queued. Waiting for device update.",
                isError: false,
                expectedState:
                    command.type === "SET_ACTUATOR_STATE"
                        ? command.state
                        : undefined,
                expectedControlMode:
                    command.type === "SET_CONTROL_MODE"
                        ? command.controlMode
                        : undefined,
            });
        } catch (error) {
            setFeedback({
                actuatorId,
                message:
                    error instanceof Error
                        ? error.message
                        : "Failed to send command.",
                isError: true,
            });
        } finally {
            setPendingActuators((current) =>
                current.filter((id) => id !== actuatorId)
            );
        }
    }

    return (
        <div className="actuators-overview-content">
            <div className="actuators-overview-header">
                <div>
                    <h3>Actuators</h3>
                    <span>Current state and control mode</span>
                </div>

                <span className="actuator-count">{actuators.length}</span>
            </div>

            {actuators.length > 0 ? (
                <ul className="actuator-list">
                    {actuators.map((actuator) => {
                        const isPending = pendingActuators.includes(
                            actuator.id
                        );

                        const actuatorFeedback =
                            feedback?.actuatorId === actuator.id ? feedback : null;

                        const feedbackResolved =
                            actuatorFeedback !== null &&
                            (
                                (actuatorFeedback.expectedState !== undefined &&
                                    actuator.state === actuatorFeedback.expectedState) ||
                                (actuatorFeedback.expectedControlMode !== undefined &&
                                    actuator.controlMode === actuatorFeedback.expectedControlMode)
                            );

                        return (
                            <li className="actuator-row" key={actuator.id}>
                                <img
                                    className="actuator-icon"
                                    src={actuatorIcons[actuator.type]}
                                    alt=""
                                />

                                <div className="actuator-info">
                                    <strong>{actuator.name}</strong>
                                    <span>
                                        {actuator.type.replaceAll("_", " ")}
                                    </span>

                                    <div className="actuator-status">
                                        <span
                                            className={`actuator-state actuator-state-${actuator.state.toLowerCase()}`}
                                        >
                                            {actuator.state}
                                        </span>

                                        <span className="actuator-mode">
                                            {actuator.controlMode}
                                        </span>
                                    </div>
                                </div>

                                <div className="actuator-controls">
                                    <button
                                        type="button"
                                        className="actuator-mode-button"
                                        disabled={isPending}
                                        onClick={() =>
                                            void handleModeChange(
                                                actuator.id,
                                                actuator.controlMode === "AUTO"
                                                    ? "MANUAL"
                                                    : "AUTO"
                                            )
                                        }
                                    >
                                        Switch to{" "}
                                        {actuator.controlMode === "AUTO"
                                            ? "MANUAL"
                                            : "AUTO"}
                                    </button>

                                    <div className="actuator-state-controls">
                                        <button
                                            type="button"
                                            className={
                                                actuator.state === "ON"
                                                    ? "actuator-control-button is-active"
                                                    : "actuator-control-button"
                                            }
                                            disabled={
                                                isPending ||
                                                actuator.controlMode !== "MANUAL" ||
                                                actuator.state === "ON"
                                            }
                                            onClick={() =>
                                                void handleStateChange(
                                                    actuator.id,
                                                    "ON"
                                                )
                                            }
                                        >
                                            ON
                                        </button>

                                        <button
                                            type="button"
                                            className={
                                                actuator.state === "OFF"
                                                    ? "actuator-control-button is-active"
                                                    : "actuator-control-button"
                                            }
                                            disabled={
                                                isPending ||
                                                actuator.controlMode !== "MANUAL" ||
                                                actuator.state === "OFF"
                                            }
                                            onClick={() =>
                                                void handleStateChange(
                                                    actuator.id,
                                                    "OFF"
                                                )
                                            }
                                        >
                                            OFF
                                        </button>
                                    </div>

                                    {isPending && (
                                        <span className="actuator-feedback">
                                            Sending...
                                        </span>
                                    )}

                                    {actuatorFeedback && !feedbackResolved && (
                                        <span
                                            className={`actuator-feedback ${actuatorFeedback.isError
                                                ? "is-error"
                                                : ""
                                                }`}
                                            role={
                                                actuatorFeedback.isError
                                                    ? "alert"
                                                    : "status"
                                            }
                                        >
                                            {actuatorFeedback.message}
                                        </span>
                                    )}
                                </div>
                            </li>
                        );
                    })}
                </ul>
            ) : (
                <p className="actuator-empty">
                    No actuators found for this device.
                </p>
            )}
        </div>
    );
}
