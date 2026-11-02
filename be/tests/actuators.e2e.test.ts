import { createCommand } from "../src/services/commandService.js";
import request from "supertest";
import { createHash } from "node:crypto";
import argon2 from "argon2";
import crypto from "node:crypto";
import app from "../src/app.js";

import { db } from "../src/database/connection.js";

import {
    resetTestDatabase,
    seedTestDatabase
} from "./fixtures/database.js";

async function insertPendingCommand(
    actuatorId: number,
    type: "SET_ACTUATOR_STATE" | "SET_CONTROL_MODE",
    state: "ON" | "OFF" | null,
    controlMode: "AUTO" | "MANUAL" | null
): Promise<number> {
    const [result] = await db.query(
        `
        INSERT INTO commands (
            device_id,
            actuator_id,
            type,
            state,
            control_mode,
            status
        )
        SELECT
            device_id,
            id,
            ?,
            ?,
            ?,
            'PENDING'
        FROM actuators
        WHERE id = ?
        `,
        [type, state, controlMode, actuatorId]
    );

    const insertResult = result as { insertId: number };

    if (insertResult.insertId === 0) {
        throw new Error(
            `Unable to create a test command for actuator ${actuatorId}`
        );
    }

    return insertResult.insertId;
}

async function createAuthenticatedOperator() {
    const agent = request.agent(app);
    const username = `actuator_test_${crypto.randomUUID().replace(/-/g, "")}`;
    const password = "TestPassword-Secure-2026!";

    const passwordHash = await argon2.hash(password, {
        type: argon2.argon2id
    });

    const [result] = await db.execute(
        `
        INSERT INTO users (username, password_hash, is_active)
        VALUES (?, ?, TRUE)
        `,
        [username, passwordHash]
    );

    const userId = (result as { insertId: number }).insertId;

    try {
        const csrfResponse = await agent.get("/api/auth/csrf");

        expect(csrfResponse.status).toBe(200);

        const loginResponse = await agent
            .post("/api/auth/login")
            .set("X-CSRF-Token", csrfResponse.body.csrfToken)
            .send({ username, password });

        expect(loginResponse.status).toBe(200);

        return {
            agent,
            csrfToken: loginResponse.body.csrfToken as string,
            userId
        };
    } catch (error) {
        await db.execute("DELETE FROM users WHERE id = ?", [userId]);
        throw error;
    }
}


async function cleanupAuthenticatedOperator(
    operator: Awaited<ReturnType<typeof createAuthenticatedOperator>>
): Promise<void> {
    try {
        await operator.agent
            .post("/api/auth/logout")
            .set("X-CSRF-Token", operator.csrfToken);
    } finally {
        await db.execute(
            "DELETE FROM users WHERE id = ?",
            [operator.userId]
        );
    }
}


describe("Actuators API", () => {
    beforeEach(async () => {
        await resetTestDatabase();
        await seedTestDatabase();
    });

    it("GET /api/actuators should return all actuators", async () => {
        const response = await request(app)
            .get("/api/actuators");

        expect(response.status).toBe(200);

        expect(response.body).toHaveLength(3);

        expect(response.body).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    name: "Test Water Pump",
                    type: "WATER_PUMP",
                    state: "OFF",
                    controlMode: "AUTO"
                }),
                expect.objectContaining({
                    name: "Test Ventilation Fan",
                    type: "VENTILATION_FAN",
                    state: "OFF",
                    controlMode: "AUTO"
                }),
                expect.objectContaining({
                    name: "Test Grow Light",
                    type: "GROW_LIGHT",
                    state: "OFF",
                    controlMode: "AUTO"
                })
            ])
        );
    });

    it("GET /api/actuators/:id should return an actuator", async () => {
        const listResponse = await request(app)
            .get("/api/actuators");

        const actuator = listResponse.body[0];

        const response = await request(app)
            .get(`/api/actuators/${actuator.id}`);

        expect(response.status).toBe(200);

        expect(response.body).toMatchObject({
            id: actuator.id,
            name: actuator.name,
            type: actuator.type,
            state: "OFF",
            controlMode: "AUTO"
        });
    });

    
    it("POST /api/actuators/:id/command should reject anonymous users", async () => {
        const listResponse = await request(app).get("/api/actuators");
        const actuator = listResponse.body[0];

        const response = await request(app)
            .post(`/api/actuators/${actuator.id}/command`)
            .send({
                type: "SET_ACTUATOR_STATE",
                state: "ON"
            });

        expect(response.status).toBe(401);
        expect(response.body.message).toBe("Authentication required");

        const [rows] = await db.query("SELECT id FROM commands");
        expect(rows).toHaveLength(0);
    });

    it("POST /api/actuators/:id/command should reject an authenticated user without a CSRF token", async () => {
        const listResponse = await request(app).get("/api/actuators");
        const actuator = listResponse.body[0];
        const operator = await createAuthenticatedOperator();

        try {
            const response = await operator.agent
                .post(`/api/actuators/${actuator.id}/command`)
                .send({
                    type: "SET_ACTUATOR_STATE",
                    state: "ON"
                });

            expect(response.status).toBe(403);
            expect(response.body.message).toBe("Invalid CSRF token");

            const [rows] = await db.query("SELECT id FROM commands");
            expect(rows).toHaveLength(0);
        } finally {
            await cleanupAuthenticatedOperator(operator);
        }
    });

    it("POST /api/actuators/:id/command should reject an invalid CSRF token", async () => {
        const listResponse = await request(app).get("/api/actuators");
        const actuator = listResponse.body[0];
        const operator = await createAuthenticatedOperator();

        try {
            const response = await operator.agent
                .post(`/api/actuators/${actuator.id}/command`)
                .set("X-CSRF-Token", "invalid-token")
                .send({
                    type: "SET_ACTUATOR_STATE",
                    state: "ON"
                });

            expect(response.status).toBe(403);
            expect(response.body.message).toBe("Invalid CSRF token");

            const [rows] = await db.query("SELECT id FROM commands");
            expect(rows).toHaveLength(0);
        } finally {
            await cleanupAuthenticatedOperator(operator);
        }
    });

    it("POST /api/actuators/:id/command should create a command for an authenticated operator", async () => {
        const listResponse = await request(app).get("/api/actuators");
        const actuator = listResponse.body[0];
        const operator = await createAuthenticatedOperator();

        try {
            const response = await operator.agent
                .post(`/api/actuators/${actuator.id}/command`)
                .set("X-CSRF-Token", operator.csrfToken)
                .send({
                    type: "SET_ACTUATOR_STATE",
                    state: "ON"
                });

            expect(response.status).toBe(201);
            expect(response.body).toMatchObject({
                actuatorId: actuator.id,
                type: "SET_ACTUATOR_STATE",
                state: "ON",
                status: "PENDING"
            });

            const [rows] = await db.query(
                "SELECT id, actuator_id, type, state, status FROM commands"
            );

            expect(rows).toHaveLength(1);
            expect(rows).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        actuator_id: actuator.id,
                        type: "SET_ACTUATOR_STATE",
                        state: "ON",
                        status: "PENDING"
                    })
                ])
            );
        } finally {
            await cleanupAuthenticatedOperator(operator);
        }
    });


    it("GET /api/device/commands should return pending commands", async () => {
        const listResponse = await request(app)
            .get("/api/actuators");

        const actuator = listResponse.body[0];

        await insertPendingCommand(
            actuator.id,
            "SET_ACTUATOR_STATE",
            "ON",
            null
        );

        const response = await request(app)
            .get("/api/device/commands")
            .query({
                deviceId: "GREENHOUSE_TEST"
            })
            .set("X-API-Key", "test-device-api-key");

        expect(response.status).toBe(200);

        expect(response.body.commands).toHaveLength(1);

        expect(response.body.commands[0]).toMatchObject({
            actuatorId: actuator.id,
            type: "SET_ACTUATOR_STATE",
            state: "ON",
            controlMode: null,
            status: "PENDING"
        });
    });

    it("POST /api/device/command-results should execute a successful command", async () => {
        const listResponse = await request(app)
            .get("/api/actuators");

        const actuator = listResponse.body[0];

        const commandId = await insertPendingCommand(
            actuator.id,
            "SET_ACTUATOR_STATE",
            "ON",
            null
        );

        const resultResponse = await request(app)
            .post("/api/device/command-results")
            .set("X-API-Key", "test-device-api-key")
            .send({
                commandId,
                deviceId: "GREENHOUSE_TEST",
                success: true
            });

        expect(resultResponse.status).toBe(200);

        expect(resultResponse.body).toEqual({
            message: "Command result received"
        });

        const actuatorResponse = await request(app)
            .get(`/api/actuators/${actuator.id}`);

        expect(actuatorResponse.status).toBe(200);

        expect(actuatorResponse.body).toMatchObject({
            id: actuator.id,
            state: "ON",
            controlMode: "AUTO"
        });

        const [rows] = await db.query(
            `
        SELECT
            status,
            completed_at AS completedAt
        FROM commands
        WHERE id = ?
        `,
            [commandId]
        );

        const commands = rows as {
            status: string;
            completedAt: Date | null;
        }[];

        expect(commands).toHaveLength(1);

        expect(commands[0]).toMatchObject({
            status: "EXECUTED"
        });

        expect(commands[0].completedAt).not.toBeNull();
    });

    it("POST /api/device/command-results should fail an unsuccessful command", async () => {
        const listResponse = await request(app)
            .get("/api/actuators");

        const actuator = listResponse.body[0];

        const commandId = await insertPendingCommand(
            actuator.id,
            "SET_ACTUATOR_STATE",
            "ON",
            null
        );

        const resultResponse = await request(app)
            .post("/api/device/command-results")
            .set("X-API-Key", "test-device-api-key")
            .send({
                commandId,
                deviceId: "GREENHOUSE_TEST",
                success: false
            });

        expect(resultResponse.status).toBe(200);

        const actuatorResponse = await request(app)
            .get(`/api/actuators/${actuator.id}`);

        expect(actuatorResponse.status).toBe(200);

        expect(actuatorResponse.body).toMatchObject({
            id: actuator.id,
            state: "OFF",
            controlMode: "AUTO"
        });

        const [rows] = await db.query(
            `
        SELECT
            status,
            completed_at AS completedAt
        FROM commands
        WHERE id = ?
        `,
            [commandId]
        );

        const commands = rows as {
            status: string;
            completedAt: Date | null;
        }[];

        expect(commands).toHaveLength(1);

        expect(commands[0]).toMatchObject({
            status: "FAILED"
        });

        expect(commands[0].completedAt).not.toBeNull();
    });

    it("POST /api/device/command-results should be idempotent", async () => {
        const listResponse = await request(app)
            .get("/api/actuators");

        const actuator = listResponse.body[0];

        const commandId = await insertPendingCommand(
            actuator.id,
            "SET_ACTUATOR_STATE",
            "ON",
            null
        );

        const firstResult = await request(app)
            .post("/api/device/command-results")
            .set("X-API-Key", "test-device-api-key")
            .send({
                commandId,
                deviceId: "GREENHOUSE_TEST",
                success: true
            });

        expect(firstResult.status).toBe(200);

        const secondResult = await request(app)
            .post("/api/device/command-results")
            .set("X-API-Key", "test-device-api-key")
            .send({
                commandId,
                deviceId: "GREENHOUSE_TEST",
                success: true
            });

        expect(secondResult.status).toBe(200);

        const actuatorResponse = await request(app)
            .get(`/api/actuators/${actuator.id}`);

        expect(actuatorResponse.status).toBe(200);

        expect(actuatorResponse.body).toMatchObject({
            id: actuator.id,
            state: "ON",
            controlMode: "AUTO"
        });

        const [rows] = await db.query(
            `
        SELECT
            status,
            completed_at AS completedAt
        FROM commands
        WHERE id = ?
        `,
            [commandId]
        );

        const commands = rows as {
            status: string;
            completedAt: Date | null;
        }[];

        expect(commands).toHaveLength(1);

        expect(commands[0]).toMatchObject({
            status: "EXECUTED"
        });

        expect(commands[0].completedAt).not.toBeNull();
    });

    it("POST /api/device/command-results should execute a control mode command", async () => {
        const listResponse = await request(app)
            .get("/api/actuators");

        const actuator = listResponse.body[0];

        const commandId = await insertPendingCommand(
            actuator.id,
            "SET_CONTROL_MODE",
            null,
            "MANUAL"
        );

        const resultResponse = await request(app)
            .post("/api/device/command-results")
            .set("X-API-Key", "test-device-api-key")
            .send({
                commandId,
                deviceId: "GREENHOUSE_TEST",
                success: true
            });

        expect(resultResponse.status).toBe(200);

        const actuatorResponse = await request(app)
            .get(`/api/actuators/${actuator.id}`);

        expect(actuatorResponse.status).toBe(200);

        expect(actuatorResponse.body).toMatchObject({
            id: actuator.id,
            controlMode: "MANUAL"
        });
    });

    it("createCommand should reject an invalid state command payload", async () => {
        const listResponse = await request(app)
            .get("/api/actuators");

        const actuator = listResponse.body[0];

        await expect(
            createCommand(
                actuator.id,
                "SET_ACTUATOR_STATE",
                "ON",
                "MANUAL"
            )
        ).rejects.toThrow(
            "Invalid payload for SET_ACTUATOR_STATE"
        );

        const [rows] = await db.query(
            "SELECT COUNT(*) AS count FROM commands"
        );

        const result = rows as {
            count: number;
        }[];

        expect(result[0].count).toBe(0);
    });

    it("createCommand should reject an invalid control mode command payload", async () => {
        const listResponse = await request(app)
            .get("/api/actuators");

        const actuator = listResponse.body[0];

        await expect(
            createCommand(
                actuator.id,
                "SET_CONTROL_MODE",
                "ON",
                "MANUAL"
            )
        ).rejects.toThrow(
            "Invalid payload for SET_CONTROL_MODE"
        );

        const [rows] = await db.query(
            "SELECT COUNT(*) AS count FROM commands"
        );

        const result = rows as {
            count: number;
        }[];

        expect(result[0].count).toBe(0);
    });

    it("POST /api/device/command-results should reject a command from another device", async () => {
        const otherApiKey = "other-device-api-key";

        const apiKeyHash = createHash("sha256")
            .update(otherApiKey)
            .digest("hex");

        const [deviceResult] = await db.query(
            `
        INSERT INTO devices (
            device_id,
            name,
            status,
            api_key_hash
        )
        VALUES (?, ?, 'OFFLINE', ?)
        `,
            [
                "GREENHOUSE_OTHER",
                "Other Greenhouse",
                apiKeyHash
            ]
        );

        const otherDeviceId = (
            deviceResult as { insertId: number }
        ).insertId;

        const [actuatorResult] = await db.query(
            `
        INSERT INTO actuators (
            device_id,
            name,
            type,
            state,
            control_mode
        )
        VALUES (?, ?, 'WATER_PUMP', 'OFF', 'AUTO')
        `,
            [
                otherDeviceId,
                "Other Water Pump"
            ]
        );

        const otherActuatorId = (
            actuatorResult as { insertId: number }
        ).insertId;

        const commandId = await insertPendingCommand(
            otherActuatorId,
            "SET_ACTUATOR_STATE",
            "ON",
            null
        );

        const resultResponse = await request(app)
            .post("/api/device/command-results")
            .set("X-API-Key", "test-device-api-key")
            .send({
                commandId,
                deviceId: "GREENHOUSE_TEST",
                success: true
            });

        expect(resultResponse.status).toBe(404);

        expect(resultResponse.body).toEqual({
            message: "Command not found or does not belong to device"
        });

        const [rows] = await db.query(
            `
        SELECT
            status
        FROM commands
        WHERE id = ?
        `,
            [commandId]
        );

        const commands = rows as {
            status: string;
        }[];

        expect(commands).toHaveLength(1);

        expect(commands[0]).toEqual({
            status: "PENDING"
        });
    });

});