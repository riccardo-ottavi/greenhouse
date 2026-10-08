import request from "supertest";
import { createHash } from "node:crypto";

import app from "../src/app.js";

import { db } from "../src/database/connection.js";

import {
    resetTestDatabase,
    seedTestDatabase
} from "./fixtures/database.js";

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

    it("POST /api/actuators/:id/command should create a pending state command", async () => {
        const listResponse = await request(app)
            .get("/api/actuators");

        const actuator = listResponse.body[0];

        const response = await request(app)
            .post(`/api/actuators/${actuator.id}/command`)
            .send({
                type: "SET_ACTUATOR_STATE",
                state: "ON"
            });

        expect(response.status).toBe(201);

        expect(response.body).toMatchObject({
            actuatorId: actuator.id,
            type: "SET_ACTUATOR_STATE",
            state: "ON",
            controlMode: null,
            status: "PENDING"
        });

        const [rows] = await db.query(
            `
        SELECT
            actuator_id AS actuatorId,
            type,
            state,
            control_mode AS controlMode,
            status
        FROM commands
        WHERE id = ?
        `,
            [response.body.id]
        );

        const commands = rows as {
            actuatorId: number;
            type: string;
            state: string | null;
            controlMode: string | null;
            status: string;
        }[];

        expect(commands).toHaveLength(1);

        expect(commands[0]).toEqual({
            actuatorId: actuator.id,
            type: "SET_ACTUATOR_STATE",
            state: "ON",
            controlMode: null,
            status: "PENDING"
        });
    });

    it("GET /api/device/commands should return pending commands", async () => {
        const listResponse = await request(app)
            .get("/api/actuators");

        const actuator = listResponse.body[0];

        await request(app)
            .post(`/api/actuators/${actuator.id}/command`)
            .send({
                type: "SET_ACTUATOR_STATE",
                state: "ON"
            });

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

        const commandResponse = await request(app)
            .post(`/api/actuators/${actuator.id}/command`)
            .send({
                type: "SET_ACTUATOR_STATE",
                state: "ON"
            });

        expect(commandResponse.status).toBe(201);

        const commandId = commandResponse.body.id;

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

        const commandResponse = await request(app)
            .post(`/api/actuators/${actuator.id}/command`)
            .send({
                type: "SET_ACTUATOR_STATE",
                state: "ON"
            });

        expect(commandResponse.status).toBe(201);

        const commandId = commandResponse.body.id;

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

        const commandResponse = await request(app)
            .post(`/api/actuators/${actuator.id}/command`)
            .send({
                type: "SET_ACTUATOR_STATE",
                state: "ON"
            });

        expect(commandResponse.status).toBe(201);

        const commandId = commandResponse.body.id;

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

        const commandResponse = await request(app)
            .post(`/api/actuators/${actuator.id}/command`)
            .send({
                type: "SET_CONTROL_MODE",
                controlMode: "MANUAL"
            });

        expect(commandResponse.status).toBe(201);

        expect(commandResponse.body).toMatchObject({
            actuatorId: actuator.id,
            type: "SET_CONTROL_MODE",
            state: null,
            controlMode: "MANUAL",
            status: "PENDING"
        });

        const resultResponse = await request(app)
            .post("/api/device/command-results")
            .set("X-API-Key", "test-device-api-key")
            .send({
                commandId: commandResponse.body.id,
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

    it("POST /api/actuators/:id/command should reject an invalid state command payload", async () => {
        const listResponse = await request(app)
            .get("/api/actuators");

        const actuator = listResponse.body[0];

        const response = await request(app)
            .post(`/api/actuators/${actuator.id}/command`)
            .send({
                type: "SET_ACTUATOR_STATE",
                state: "ON",
                controlMode: "MANUAL"
            });

        expect(response.status).toBe(400);

        expect(response.body).toEqual({
            message: "Invalid payload for SET_ACTUATOR_STATE"
        });

        const [rows] = await db.query(
            "SELECT COUNT(*) AS count FROM commands"
        );

        const result = rows as {
            count: number;
        }[];

        expect(result[0].count).toBe(0);
    });

    it("POST /api/actuators/:id/command should reject an invalid control mode command payload", async () => {
        const listResponse = await request(app)
            .get("/api/actuators");

        const actuator = listResponse.body[0];

        const response = await request(app)
            .post(`/api/actuators/${actuator.id}/command`)
            .send({
                type: "SET_CONTROL_MODE",
                controlMode: "MANUAL",
                state: "ON"
            });

        expect(response.status).toBe(400);

        expect(response.body).toEqual({
            message: "Invalid payload for SET_CONTROL_MODE"
        });

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

        const commandResponse = await request(app)
            .post(`/api/actuators/${otherActuatorId}/command`)
            .send({
                type: "SET_ACTUATOR_STATE",
                state: "ON"
            });

        expect(commandResponse.status).toBe(201);

        const commandId = commandResponse.body.id;

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