import request from "supertest";
import app from "../src/app.js";

describe("API smoke test", () => {
  it("GET / should return 200", async () => {
    const response = await request(app)
      .get("/");

    expect(response.status).toBe(200);
    expect(response.text).toContain(
      "Greenhouse Monitoring System Homepage"
    );
  });
});