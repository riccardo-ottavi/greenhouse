import "express-session";

declare module "express-session" {
  interface SessionData {
    userId?: number;
    csrfToken?: string;
  }
}

declare global {
  namespace Express {
    interface Request {
      authenticatedDeviceId?: string;
    }
  }
}

export {};
