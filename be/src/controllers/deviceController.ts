import { getAllDevices, getDeviceById, updateHeartbeat } from "../services/deviceService";
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