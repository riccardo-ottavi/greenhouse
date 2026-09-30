import { createReading, getAllReadings, getReadingById } from "../services/readingService";
import { Request, Response } from "express";
import { AppError } from "../errors/AppError.js";

export async function index(req: Request, res: Response) {
  try {
    const readings = await getAllReadings();

    res.json(readings);
  }
  catch (err) {

    console.error(err);

    res.status(500).json({ message: "Couldn't get readings" });

  }

}

export async function show(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    const reading = await getReadingById(id);
    res.json(reading);
  }
  catch (err) {
    console.error(err);
    res.status(500).json({ message: "Couldn't get reading's data" })
  }
}

export async function create(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const reading = await createReading(req.body);

    res.status(201).json(reading);
  } catch (error) {
  console.error("Error creating reading:", error);

  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      message: error.message
    });

    return;
  }

  res.status(500).json({
    message: "Failed to create reading"
  });
}
}