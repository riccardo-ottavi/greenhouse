import { db } from "../src/database/connection";
import { sessionStore } from "../src/config/session";

async function testSessionStore() {
  try {
    const result = await new Promise<unknown>((resolve, reject) => {
      sessionStore.get("greenhouse-deployment-check", (error, session) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(session);
      });
    });

    console.log("Aiven session store connection successful:");
    console.log("Test session:", result);
  } catch (error) {
    console.error("Aiven session store test failed:");
    console.error(error);
    process.exitCode = 1;
  } finally {
    await sessionStore.close();
    await db.end();
  }
}

testSessionStore();