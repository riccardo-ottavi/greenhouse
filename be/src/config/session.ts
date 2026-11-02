
import "dotenv/config";
import session from "express-session";
import MySQLStoreFactory from "express-mysql-session";
import { db } from "../database/connection.js";

const sessionSecret = process.env.SESSION_SECRET;

if (!sessionSecret || sessionSecret.length < 32) {
  throw new Error(
    "SESSION_SECRET is missing or too short. Configure a secret of at least 32 characters."
  );
}

const MySQLStore = MySQLStoreFactory(session);

const isProduction = process.env.NODE_ENV === "production";

export const sessionStore = new MySQLStore(
  {
    createDatabaseTable: false,
    clearExpired: true,
    checkExpirationInterval: 15 * 60 * 1000,
    expiration: 24 * 60 * 60 * 1000,
  },
  db
);

export const sessionMiddleware = session({
  name: "greenhouse.sid",
  secret: sessionSecret,
  store: sessionStore,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: isProduction ? "none" : "lax",
    secure: isProduction,
    maxAge: 24 * 60 * 60 * 1000,
  },
});
