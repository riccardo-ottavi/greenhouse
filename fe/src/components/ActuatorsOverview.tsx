import fanIcon from "../assets/icons/fan.svg";
import growLightIcon from "../assets/icons/bulb.svg";
import waterPumpIcon from "../assets/icons/water-pump.svg";
import type { Actuator, ActuatorType } from "../types/Actuator";

const actuatorIcons: Record<ActuatorType, string> = {
    WATER_PUMP: waterPumpIcon,
    VENTILATION_FAN: fanIcon,
    GROW_LIGHT: growLightIcon,
};

interface ActuatorsOverviewProps {
    actuators: Actuator[];
}

export default function ActuatorsOverview({
    actuators,
}: ActuatorsOverviewProps) {
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
                    {actuators.map((actuator) => (
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
                            </div>
                            <div className="actuator-status">
                                <span
                                    className={`actuator-state actuator-state-${actuator.state.toLowerCase()}`}
                                >
                                    {actuator.state}
                                </span>
                                <span>{actuator.controlMode}</span>
                            </div>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="actuator-empty">No actuators found for this device.</p>
            )}
        </div>
    );
}
