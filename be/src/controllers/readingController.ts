import { AppError } from "../errors/AppError";
import { createReading, getAllReadings, getReadingById, getReadingsBySensorId } from "../services/readingService";
import { Request, Response } from "express";

export async function index(
  _req: Request,
  res: Response
): Promise<void> {
  const readings = await getAllReadings();

  res.json(readings);
}

export async function show(
  req: Request,
  res: Response
): Promise<void> {
  const id = Number(req.params.id);

  if (Number.isNaN(id)) {
    throw new AppError("Reading id must be a number", 400);
  }

  const reading = await getReadingById(id);

  if (!reading) {
    throw new AppError("Reading not found", 404);
  }

  res.json(reading);
}

export async function create(
  req: Request,
  res: Response
): Promise<void> {

  const reading = await createReading(req.body);

  res.status(201).json(reading);
}

export async function getBySensorId(
  req: Request,
  res: Response
): Promise<void> {
  const sensorId = Number(req.params.sensorId);

  const readings = await getReadingsBySensorId(sensorId);

  res.json(readings);
}