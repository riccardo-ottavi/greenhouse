import { Request, Response, NextFunction } from "express";
import { AppError } from "../errors/AppError.js";

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error("Error:", error);

  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      message: error.message
    });

    return;
  }

  res.status(500).json({
    message: "Internal server error"
  });
}