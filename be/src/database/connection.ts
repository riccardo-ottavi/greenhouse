
import dotenv from "dotenv";
import mysql from "mysql2/promise";
import fs from "node:fs";
import path from "node:path";

dotenv.config();

const ssl = process.env.DB_SSL === "true"
  ? {
      ca: fs.readFileSync(
        path.join(__dirname, "certs", "ca.pem"),
        "utf8"
      )
    }
  : undefined;

export const db = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl
});
