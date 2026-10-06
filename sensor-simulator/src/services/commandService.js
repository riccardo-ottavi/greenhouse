import deviceState from "../state/deviceState.js";

export function executeCommand(command) {
    if (deviceState.executedCommands.includes(command.id)) {
        return {
            success: true,
            alreadyExecuted: true
        };
    }

    const actuator = deviceState.actuators[command.actuatorId];

    if (!actuator) {
        return {
            success: false,
            message: "Actuator not found"
        };
    }

    if (command.type === "SET_ACTUATOR_STATE") {
        actuator.state = command.state;

        console.log(
            `DEBUG - Command executed: actuator ${command.actuatorId} → state ${actuator.state}`
        );
    } else if (command.type === "SET_CONTROL_MODE") {
        actuator.controlMode = command.controlMode;

        console.log(
            `DEBUG - Command executed: actuator ${command.actuatorId} → control mode ${actuator.controlMode}`
        );
    } else {
        return {
            success: false,
            message: "Unsupported command type"
        };
    }

    deviceState.executedCommands.push(command.id);

    return {
        success: true,
        alreadyExecuted: false
    };
}