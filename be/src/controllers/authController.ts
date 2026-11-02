import { randomBytes } from "node:crypto";
import { NextFunction, Request, Response } from "express";
import {
  authenticateUser,
  getActiveUserById
} from "../services/authService.js";

export async function login(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { username, password } = req.body ?? {};

    if (
      typeof username !== "string" ||
      typeof password !== "string" ||
      !username.trim() ||
      !password ||
      username.length > 100
    ) {
      res.status(400).json({ message: "Username and password are required" });
      return;
    }

    const user = await authenticateUser(username.trim(), password);

    if (!user) {
      res.status(401).json({ message: "Invalid username or password" });
      return;
    }

    req.session.regenerate((regenerateError) => {
      if (regenerateError) {
        next(regenerateError);
        return;
      }

      req.session.userId = user.id;
      req.session.csrfToken = randomBytes(32).toString("hex");

      req.session.save((saveError) => {
        if (saveError) {
          req.session.destroy((destroyError) => {
            next(destroyError ?? saveError);
          });
          return;
        }

        res.status(200).json({
          user,
          csrfToken: req.session.csrfToken
        });
      });
    });
  } catch (error) {
    next(error);
  }
}

export async function me(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.session.userId;

    if (!userId) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

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

        res.status(401).json({ message: "Authentication required" });
      });
      return;
    }

    res.json({ user });
  } catch (error) {
    next(error);
  }
}

export function logout(
  req: Request,
  res: Response,
  next: NextFunction
): void {
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

    res.status(200).json({ message: "Logged out successfully" });
  });
}
