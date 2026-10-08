import { Request, Response, NextFunction } from "express";
import crypto from "crypto";

import {
  getDeviceApiKeyHash
} from "../repositories/deviceRepository.js";

export async function deviceAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const apiKey = req.header("X-API-Key");
    const deviceId =
      req.body?.deviceId ??
      req.query.deviceId;

    if (!apiKey || !deviceId) {
      res.status(401).json({
        message: "Authentication required"
      });
      return;
    }

    const apiKeyHash =
      await getDeviceApiKeyHash(
        deviceId
      );

    if (!apiKeyHash) {
      res.status(401).json({
        message: "Invalid authentication credentials"
      });
      return;
    }

    const providedApiKeyHash =
      crypto
        .createHash("sha256")
        .update(apiKey)
        .digest("hex");

    const isValid =
      crypto.timingSafeEqual(
        Buffer.from(
          providedApiKeyHash,
          "hex"
        ),
        Buffer.from(
          apiKeyHash,
          "hex"
        )
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

