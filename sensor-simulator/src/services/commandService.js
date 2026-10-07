import deviceState from "../state/deviceState.js";
import {
    hasProcessedCommand,
    getProcessedCommand,
    saveProcessedCommand
} from "./commandJournal.js";

export async function executeCommand(command) {
    const alreadyProcessed = await hasProcessedCommand(command.id);

    if (alreadyProcessed) {
        const previousResult =
            await getProcessedCommand(command.id);

        console.log(
            `DEBUG - Command ${command.id} already processed. Skipping execution.`
        );

        return {
            success: previousResult.success,
            alreadyExecuted: true
        };
    }

    const actuator =
        deviceState.actuators[command.actuatorId];

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

    const result = {
        success: true,
        alreadyExecuted: false
    };

    await saveProcessedCommand(command.id, result);

    return result;
}