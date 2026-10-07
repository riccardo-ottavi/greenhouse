import {
    getAllSensorViews,
    getSensorViewById
} from "../services/sensorService.js";
import { Request, Response } from "express";

export async function index(req: Request, res: Response) {
    try {
        const sensors = await getAllSensorViews();

        res.json(sensors);
    }
    catch (err) {
        console.error(err);

        res.status(500).json({
            message: "Couldn't get sensors"
        });
    }
}

export async function show(req: Request, res: Response) {
    try {
        const id = Number(req.params.id);

        if (Number.isNaN(id)) {
            res.status(400).json({
                message: "Sensor id must be a number"
            });

            return;
        }

        const sensor = await getSensorViewById(id);

        if (!sensor) {
            res.status(404).json({
                message: "Sensor not found"
            });

            return;
        }

        res.json(sensor);
    }

    catch (err) {
        console.error(err);

        res.status(500).json({
            message: "Couldn't get sensor's data"
        });
    }
}