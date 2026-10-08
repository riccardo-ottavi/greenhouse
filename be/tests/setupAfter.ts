import { db } from "../src/database/connection.js";

afterAll(async () => {
  await db.end();
});