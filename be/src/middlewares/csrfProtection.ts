import { randomBytes, timingSafeEqual } from "node:crypto";
import { NextFunction, Request, Response } from "express";

export function issueCsrfToken(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!req.session.csrfToken) {
    req.session.csrfToken = randomBytes(32).toString("hex");
  }

  const csrfToken = req.session.csrfToken;

  req.session.save((error) => {
    if (error) {
      next(error);
      return;
    }

    res.json({ csrfToken });
  });
}

export function requireCsrfToken(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const expected = req.session.csrfToken;
  const received = req.get("X-CSRF-Token");

  if (!expected || !received) {
    res.status(403).json({ message: "Invalid CSRF token" });
    return;
  }

  const expectedBuffer = Buffer.from(expected);
  const receivedBuffer = Buffer.from(received);

  if (
    expectedBuffer.length !== receivedBuffer.length ||
    !timingSafeEqual(expectedBuffer, receivedBuffer)
  ) {
    res.status(403).json({ message: "Invalid CSRF token" });
    return;
  }

  next();
}
