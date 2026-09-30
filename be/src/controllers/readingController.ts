import { createReading, getAllReadings, getReadingById } from "../services/readingService";
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

  const reading = await getReadingById(id);

  res.json(reading);
}

export async function create(
  req: Request,
  res: Response
): Promise<void> {

  const reading = await createReading(req.body);

  res.status(201).json(reading);
}