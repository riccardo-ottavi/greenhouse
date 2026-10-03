import { ActuatorState, ControlMode } from "./Actuator";

export type CommandType =
    | "SET_ACTUATOR_STATE"
    | "SET_CONTROL_MODE";

export type CommandStatus =
    | "PENDING"
    | "EXECUTED"
    | "FAILED";

export type Command = {
    id: number;
    deviceId: number;
    actuatorId: number;
    type: CommandType;
    state: ActuatorState | null;
    controlMode: ControlMode | null;
    status: CommandStatus;
    createdAt: Date;
    completedAt: Date | null;
};