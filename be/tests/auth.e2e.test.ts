import request from "supertest";
import argon2 from "argon2";
import crypto from "node:crypto";

import app from "../src/app.js";
import { db } from "../src/database/connection.js";
import express from "express";
import { sessionMiddleware } from "../src/config/session.js";
import { sessionStore } from "../src/config/session.js";
import {
  createAuthRouter,
  createLoginRateLimiter
} from "../src/routes/authRouter.js";

const TEST_USERNAME = `auth_test_${crypto.randomUUID().replace(/-/g, "")}`;
const TEST_PASSWORD = "TestPassword-Secure-2026!";
const createdSessionIds = new Set<string>();

let testUserId: number;
const testAgents: Array<ReturnType<typeof request.agent>> = [];

async function createTestUser(isActive = true): Promise<void> {
  const passwordHash = await argon2.hash(TEST_PASSWORD, {
    type: argon2.argon2id
  });

  const [result] = await db.execute(
    `
      INSERT INTO users (username, password_hash, is_active)
      VALUES (?, ?, ?)
    `,
    [TEST_USERNAME, passwordHash, isActive]
  );

  testUserId = (result as { insertId: number }).insertId;
}

function createTestAgent() {
  const agent = request.agent(app);
  testAgents.push(agent);
  return agent;
}

async function getCsrfToken(
  agent: ReturnType<typeof request.agent>
): Promise<string> {
  const response = await agent.get("/api/auth/csrf");

  expect(response.status).toBe(200);
  expect(response.body.csrfToken).toEqual(expect.any(String));

  return response.body.csrfToken;
}

async function login(
  agent: ReturnType<typeof request.agent>
): Promise<request.Response> {
  const csrfToken = await getCsrfToken(agent);

  return agent
    .post("/api/auth/login")
    .set("X-CSRF-Token", csrfToken)
    .send({
      username: TEST_USERNAME,
      password: TEST_PASSWORD
    });
}

function createRateLimitTestApp() {
  const testApp = express();

  testApp.use(express.json());
  testApp.use(sessionMiddleware);
  testApp.use(
    "/api/auth",
    createAuthRouter(createLoginRateLimiter())
  );

  return testApp;
}

const originalSessionStoreSet = sessionStore.set.bind(sessionStore);

beforeAll(() => {
  jest.spyOn(sessionStore, "set").mockImplementation(
    (sessionId, session, callback) => {
      createdSessionIds.add(sessionId);

      return originalSessionStoreSet(sessionId, session, callback);
    }
  );
});

describe("Authentication API", () => {
  beforeEach(async () => {
    await createTestUser();
  });


  afterEach(async () => {
  try {
    if (createdSessionIds.size > 0) {
      const sessionIds = [...createdSessionIds];
      const placeholders = sessionIds.map(() => "?").join(", ");

      await db.execute(
        `DELETE FROM sessions WHERE session_id IN (${placeholders})`,
        sessionIds
      );
    }
  } finally {
    try {
      if (testUserId !== undefined) {
        await db.execute(
          "DELETE FROM users WHERE id = ?",
          [testUserId]
        );
      }
    } finally {
      createdSessionIds.clear();
      testAgents.length = 0;
      testUserId = undefined as unknown as number;
    }
  }
});


  it("logs in with valid credentials and persists the session", async () => {
    const agent = createTestAgent();

    const response = await login(agent);

    expect(response.status).toBe(200);
    expect(response.body.user).toEqual({
      id: testUserId,
      username: TEST_USERNAME
    });
    expect(response.body.csrfToken).toEqual(expect.any(String));
    expect(response.body.user.passwordHash).toBeUndefined();

    const meResponse = await agent.get("/api/auth/me");

    expect(meResponse.status).toBe(200);
    expect(meResponse.body.user).toEqual({
      id: testUserId,
      username: TEST_USERNAME
    });
  });

  it("rejects invalid credentials", async () => {
    const agent = createTestAgent();
    const csrfToken = await getCsrfToken(agent);

    const response = await agent
      .post("/api/auth/login")
      .set("X-CSRF-Token", csrfToken)
      .send({
        username: TEST_USERNAME,
        password: "WrongPassword-2026!"
      });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Invalid username or password");
  });

  it("rejects missing login fields", async () => {
    const agent = createTestAgent();
    const csrfToken = await getCsrfToken(agent);

    const response = await agent
      .post("/api/auth/login")
      .set("X-CSRF-Token", csrfToken)
      .send({
        username: TEST_USERNAME
      });

    expect(response.status).toBe(400);
  });

  it("rejects a disabled account", async () => {
    await db.execute(
      "UPDATE users SET is_active = FALSE WHERE id = ?",
      [testUserId]
    );

    const agent = createTestAgent();
    const response = await login(agent);

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Invalid username or password");
  });

  it("rejects login without a valid CSRF token", async () => {
    const agent = createTestAgent();

    const response = await agent
      .post("/api/auth/login")
      .send({
        username: TEST_USERNAME,
        password: TEST_PASSWORD
      });

    expect(response.status).toBe(403);
  });

  it("rejects logout without a valid CSRF token", async () => {
    const agent = createTestAgent();
    const loginResponse = await login(agent);

    expect(loginResponse.status).toBe(200);

    const response = await agent
      .post("/api/auth/logout")
      .set("X-CSRF-Token", "invalid-token");

    expect(response.status).toBe(403);

    const meResponse = await agent.get("/api/auth/me");
    expect(meResponse.status).toBe(200);
  });

  it("logs out and invalidates the session", async () => {
    const agent = createTestAgent();
    const loginResponse = await login(agent);

    expect(loginResponse.status).toBe(200);

    const response = await agent
      .post("/api/auth/logout")
      .set("X-CSRF-Token", loginResponse.body.csrfToken);

    expect(response.status).toBe(200);

    const meResponse = await agent.get("/api/auth/me");
    expect(meResponse.status).toBe(401);
  });

  it("rejects access to /me without a session", async () => {
    const response = await request(app).get("/api/auth/me");

    expect(response.status).toBe(401);
  });

  it("rejects an account disabled after login", async () => {
    const agent = createTestAgent();
    const loginResponse = await login(agent);

    expect(loginResponse.status).toBe(200);

    await db.execute(
      "UPDATE users SET is_active = FALSE WHERE id = ?",
      [testUserId]
    );

    const meResponse = await agent.get("/api/auth/me");

    expect(meResponse.status).toBe(401);
  });

  it("blocks login attempts after the configured limit", async () => {
    const rateLimitApp = createRateLimitTestApp();
    const agent = request.agent(rateLimitApp);

    for (let attempt = 0; attempt < 10; attempt++) {
      const csrfToken = await getCsrfToken(agent);

      const response = await agent
        .post("/api/auth/login")
        .set("X-CSRF-Token", csrfToken)
        .send({
          username: TEST_USERNAME,
          password: "WrongPassword-2026!"
        });

      expect(response.status).toBe(401);
    }

    const csrfToken = await getCsrfToken(agent);

    const response = await agent
      .post("/api/auth/login")
      .set("X-CSRF-Token", csrfToken)
      .send({
        username: TEST_USERNAME,
        password: "WrongPassword-2026!"
      });

    expect(response.status).toBe(429);
    expect(response.body.message).toBe(
      "Too many login attempts. Please try again later."
    );
  });

});
