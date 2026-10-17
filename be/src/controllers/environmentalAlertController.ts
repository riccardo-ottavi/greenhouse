import { Request, Response } from "express";

import {
  getActiveEnvironmentalAlerts
} from "../services/environmentalAlertService.js";

export async function index(
  _req: Request,
  res: Response
) {
  try {
    const alerts = await getActiveEnvironmentalAlerts();

    res.json(alerts);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Couldn't get environmental alerts"
    });
  }
}