import { updateActuatorStatus } from "../services/actuatorService";
import { getAllDevices, getDeviceActuatorStates, getDeviceById, updateHeartbeat } from "../services/deviceService";
import { Request, Response } from "express";

export async function index(req: Request, res: Response) {
    try {
        const devices = await getAllDevices();
        res.json(devices);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({
            message: "Couldn't get devices"
        });
    }
}

export async function show(req: Request, res: Response) {
    try {
        const id = Number(req.params.id);

        if (Number.isNaN(id)) {
            res.status(400).json({
                message: "Device id must be a number"
            });
            return;
        }

        const device = await getDeviceById(id);

        if (!device) {
            res.status(404).json({
                message: "Device not found"
            });
            return;
        }

        res.json(device);
    }

    catch (err) {
        console.error(err);
        res.status(500).json({
            message: "Couldn't get device's data"
        });
    }
}

export async function heartbeat(req: Request, res: Response) {
    try {
        const { deviceId } = req.body;

        if (!deviceId || typeof deviceId !== "string") {
            res.status(400).json({
                message: "deviceId is required"
            });
            return;
        }

        const updated = await updateHeartbeat(deviceId);

        if (!updated) {
            res.status(404).json({
                message: "Device not found"
            });
            return;
        }

        res.json({
            message: "Heartbeat received"
        });
    }

    catch (err) {
        console.error(err);
        res.status(500).json({
            message: "Couldn't update device heartbeat"
        });
    }
}

export async function updateStatus(req: Request, res: Response) {
    try {
        const { deviceId, actuators } = req.body;

        if (!deviceId || typeof deviceId !== "string") {
            res.status(400).json({
                message: "deviceId is required"
            });
            return;
        }

        if (!Array.isArray(actuators)) {
            res.status(400).json({
                message: "actuators must be an array"
            });
            return;
        }

        for (const actuator of actuators) {
            if (
                typeof actuator.actuatorId !== "number" ||
                !["ON", "OFF"].includes(actuator.state) ||
                !["AUTO", "MANUAL"].includes(actuator.controlMode)
            ) {
                res.status(400).json({
                    message: "Invalid actuator status"
                });
                return;
            }

            await updateActuatorStatus(
                deviceId,
                actuator.actuatorId,
                actuator.state,
                actuator.controlMode
            );
        }

        res.json({
            message: "Device status updated"
        });
    }

    catch (err) {
        console.error(err);
        res.status(500).json({
            message: "Couldn't update device status"
        });
    }
}

export async function getConfig(req: Request, res: Response): Promise<void> {
    try {
        const deviceId = req.query.deviceId;

        if (!deviceId || typeof deviceId !== "string") {
            res.status(400).json({
                message: "deviceId query parameter is required"
            });
            return;
        }

        const actuators = await getDeviceActuatorStates(deviceId);

        res.json({
            deviceId,
            actuators
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            message: "Couldn't get device configuration"
        });
    }
}