import { AppError } from "../errors/AppError";
import { createDeviceReadings, createReading, getAllReadings, getReadingById, getReadingsBySensorId, getReadingsAggregateBySensorId } from "../services/readingService";
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

  const range = req.query.range
    ? String(req.query.range)
    : "24h";

  const limit = req.query.limit
    ? Number(req.query.limit)
    : 500;

  const cursor = req.query.cursor
    ? String(req.query.cursor)
    : undefined;

  const readings = await getReadingsBySensorId(
    sensorId,
    range as "24h" | "7d" | "all",
    limit,
    cursor
  );

  res.json(readings);
}

export async function createFromDevice(
  req: Request,
  res: Response
): Promise<void> {
  const deviceId = req.authenticatedDeviceId;

  if (!deviceId) {
    throw new AppError("Authenticated device is required", 401);
  }

  const readings = await createDeviceReadings({
    ...req.body,
    deviceId
  });

  res.status(201).json(readings);
}

export async function getAggregateBySensorId(
  req: Request,
  res: Response
): Promise<void> {
  const sensorId = Number(req.params.sensorId);

  const range = req.query.range
    ? String(req.query.range)
    : "24h";

  const aggregate = await getReadingsAggregateBySensorId(
    sensorId,
    range as "24h" | "7d" | "all"
  );

  res.json(aggregate);
}