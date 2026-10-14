export type ActuatorState = "ON" | "OFF";

export type ControlMode = "AUTO" | "MANUAL";

export type ActuatorType = "PUMP" | "FAN" | "GROW_LIGHT";

export interface Actuator {
    id: number;
    deviceId: number;
    name: string;
    type: ActuatorType;
    state: ActuatorState;
    controlMode: ControlMode;
}