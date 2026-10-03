export type ActuatorType =
    | "WATER_PUMP"
    | "VENTILATION_FAN"
    | "GROW_LIGHT";

export type ActuatorState =
    | "ON"
    | "OFF";

export type ControlMode =
    | "AUTO"
    | "MANUAL";

export type Actuator = {
    id: number;
    deviceId: number;
    name: string;
    type: ActuatorType;
    state: ActuatorState;
    controlMode: ControlMode;
    lastUpdate: Date;
};