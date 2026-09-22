import { getAllReadings, getReadingById, getReadingsBySensorId} from "../services/readingService";
import { Request, Response } from "express";

export function index(req: Request, res: Response) {

    try {

        const sensorId = req.params.sensorId;

        if (sensorId) {
            const readings = getReadingsBySensorId(Number(sensorId));
            return res.json(readings);
        }

        const readings = getAllReadings();

        res.json(readings);

    }
    catch (err) {

        console.error(err);

        res.status(500).json({ message: "Couldn't get readings" });

    }

}

export function show(req: Request, res: Response) {
    try {
        const id = Number(req.params.id);
        const reading = getReadingById(id);
        res.json(reading);
    }
    catch(err){
        console.error(err);
        res.status(500).json({message: "Couldn't get reading's data"})
    }
}