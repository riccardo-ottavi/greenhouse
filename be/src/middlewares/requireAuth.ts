
import { NextFunction, Request, Response } from "express";
import { getActiveUserById } from "../services/authService.js";

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const userId = req.session.userId;

  if (!userId) {
    res.status(401).json({
      message: "Authentication required"
    });
    return;
  }

  try {
    const user = await getActiveUserById(userId);

    if (!user) {
      req.session.destroy((error) => {
        if (error) {
          next(error);
          return;
        }

        res.clearCookie("greenhouse.sid", {
          httpOnly: true,
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production"
        });

        res.status(401).json({
          message: "Authentication required"
        });
      });

      return;
    }

    res.locals.authenticatedUser = user;
    next();
  } catch (error) {
    next(error);
  }
}
