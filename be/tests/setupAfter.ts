import { db } from "../src/database/connection.js";
import { sessionStore } from "../src/config/session.js";

afterAll(async () => {
  await sessionStore.close();
  await db.end();
});