declare global {
  namespace Express {
    interface Request {
      authenticatedDeviceId?: string;
    }
  }
}

export {};