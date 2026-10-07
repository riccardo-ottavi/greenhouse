import { Request, Response, NextFunction } from "express";
import crypto from "crypto";

import { db } from "../database/connection.js";

export async function deviceAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const apiKey = req.header("X-API-Key");
    const deviceId = req.body?.deviceId ?? req.query.deviceId;

    if (!apiKey || !deviceId) {
      res.status(401).json({
        message: "Authentication required"
      });
      return;
    }

    const [rows] = await db.query(
      `
        SELECT api_key_hash AS apiKeyHash
        FROM devices
        WHERE device_id = ?
      `,
      [deviceId]
    );

    const devices = rows as {
      apiKeyHash: string;
    }[];

    const device = devices[0];

    if (!device) {
      res.status(401).json({
        message: "Invalid authentication credentials"
      });
      return;
    }

    const apiKeyHash = crypto
      .createHash("sha256")
      .update(apiKey)
      .digest("hex");

    const isValid = crypto.timingSafeEqual(
      Buffer.from(apiKeyHash, "hex"),
      Buffer.from(device.apiKeyHash, "hex")
    );

    if (!isValid) {
      res.status(401).json({
        message: "Invalid authentication credentials"
      });
      return;
    }

    next();
  } catch (error) {
    next(error);
  }
}