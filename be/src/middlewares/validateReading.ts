import { Request, Response, NextFunction } from "express";

export function validateReading(
  req: Request,
  res: Response,
  next: NextFunction
): void {

  const { sensorId, value, timestamp } = req.body;

  if (sensorId === undefined) {
    res.status(400).json({
      message: "sensorId is required"
    });

    return;
  }

  if (typeof sensorId !== "number") {
    res.status(400).json({
      message: "sensorId must be a number"
    });

    return;
  }

  if (value === undefined) {
    res.status(400).json({
      message: "value is required"
    });

    return;
  }

  if (typeof value !== "number") {
    res.status(400).json({
      message: "value must be a number"
    });

    return;
  }

  if (timestamp === undefined) {
    res.status(400).json({
      message: "timestamp is required"
    });

    return;
  }

  if (typeof timestamp !== "string" || isNaN(Date.parse(timestamp))) {
    res.status(400).json({
      message: "timestamp must be a valid date"
    });

    return;
  }

  next();
}