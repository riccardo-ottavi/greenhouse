import { db } from "../src/database/connection.js";

describe("Database test environment", () => {
  it("should connect to greenhouse_test", async () => {
    const [rows] = await db.query(
      "SELECT DATABASE() AS databaseName"
    );

    const result = rows as {
      databaseName: string;
    }[];

    expect(result[0].databaseName).toBe(
      "greenhouse_test"
    );
  });
});