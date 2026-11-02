
import dotenv from "dotenv";
import { db } from "../src/database/connection";

dotenv.config();

async function testConnection() {
  try {
    const [rows] = await db.query(
      "SELECT DATABASE() AS databaseName, VERSION() AS mysqlVersion"
    );

    console.log("Aiven connection successful:");
    console.log(rows);
  } catch (error) {
    console.error("Aiven connection failed:");
    console.error(error);
    process.exitCode = 1;
  } finally {
    await db.end();
  }
}

testConnection();
