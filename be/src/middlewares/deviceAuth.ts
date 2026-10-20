
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

    if (
      typeof apiKey !== "string" ||
      apiKey.length === 0 ||
      typeof deviceId !== "string" ||
      deviceId.trim().length === 0
    ) {
      res.status(401).json({
        message: "Authentication required"
      });
      return;
    }

    const apiKeyHash =
      await getDeviceApiKeyHash(deviceId);

    if (
      typeof apiKeyHash !== "string" ||
      !/^[a-f0-9]{64}$/i.test(apiKeyHash)
    ) {
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
        Buffer.from(providedApiKeyHash, "hex"),
        Buffer.from(apiKeyHash, "hex")
      );

    if (!isValid) {
      res.status(401).json({
        message: "Invalid authentication credentials"
      });
      return;
    }

    req.authenticatedDeviceId = deviceId;

    next();
  } catch (error) {
    next(error);
  }
}
