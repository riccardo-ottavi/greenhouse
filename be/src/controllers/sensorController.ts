import { getAllSensors, getSensorById } from "../services/sensorService";
import { Request, Response } from "express";

export async function index(req: Request, res: Response) {
    try {
        const sensors = await getAllSensors();
        res.json(sensors);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: "Couldn't get sensors" });
    }
}

export async function show(req: Request, res: Response) {
    try {
        const id = Number(req.params.id);
        const sensor = await getSensorById(id);
        res.json(sensor);
    }
    catch(err){
        console.error(err);
        res.status(500).json({message: "Couldn't get sensor's data"})
    }
}