import request from "supertest";

import app from "../src/app.js";

import {
    resetTestDatabase,
    seedTestDatabase
} from "./fixtures/database.js";
import { markOfflineDevices } from "../src/repositories/deviceRepository.js";
import { db } from "../src/database/connection.js";

describe("Devices API", () => {
    beforeEach(async () => {
        await resetTestDatabase();
        await seedTestDatabase();
    });

    it("GET /api/devices should return all devices", async () => {
        const response = await request(app)
            .get("/api/devices");

        expect(response.status).toBe(200);

        expect(response.body).toHaveLength(1);

        expect(response.body[0]).toMatchObject({
            deviceId: "GREENHOUSE_TEST",
            name: "Test Greenhouse",
            status: "OFFLINE"
        });
    });

    it("GET /api/devices/:id should return a device", async () => {
        const listResponse = await request(app)
            .get("/api/devices");

        const device = listResponse.body[0];

        const response = await request(app)
            .get(`/api/devices/${device.id}`);

        expect(response.status).toBe(200);

        expect(response.body).toMatchObject({
            id: device.id,
            deviceId: "GREENHOUSE_TEST",
            name: "Test Greenhouse",
            status: "OFFLINE"
        });

        expect(response.body).not.toHaveProperty(
            "apiKeyHash"
        );
    });
    it("POST /api/device/heartbeat should mark the device as online", async () => {
        const response = await request(app)
            .post("/api/device/heartbeat")
            .set("X-API-Key", "test-device-api-key")
            .send({
                deviceId: "GREENHOUSE_TEST"
            });

        expect(response.status).toBe(200);

        expect(response.body).toEqual({
            message: "Heartbeat received"
        });

        const deviceResponse = await request(app)
            .get("/api/devices");

        expect(deviceResponse.status).toBe(200);

        expect(deviceResponse.body[0]).toMatchObject({
            deviceId: "GREENHOUSE_TEST",
            status: "ONLINE"
        });

        expect(deviceResponse.body[0].lastSeen).not.toBeNull();
    });

    it("POST /api/device/heartbeat should reject missing API key", async () => {
        const response = await request(app)
            .post("/api/device/heartbeat")
            .send({
                deviceId: "GREENHOUSE_TEST"
            });

        expect(response.status).toBe(401);

        expect(response.body).toEqual({
            message: "Authentication required"
        });
    });

    it("POST /api/device/heartbeat should reject invalid API key", async () => {
        const response = await request(app)
            .post("/api/device/heartbeat")
            .set("X-API-Key", "wrong-api-key")
            .send({
                deviceId: "GREENHOUSE_TEST"
            });

        expect(response.status).toBe(401);

        expect(response.body).toEqual({
            message: "Invalid authentication credentials"
        });
    });

    it("should mark a device as offline when heartbeat is too old", async () => {
        await db.query(`
        UPDATE devices
        SET
            status = 'ONLINE',
            last_seen = DATE_SUB(NOW(), INTERVAL 31 SECOND)
        WHERE device_id = ?
    `, ["GREENHOUSE_TEST"]);

        await markOfflineDevices(30);

        const response = await request(app)
            .get("/api/devices");

        expect(response.status).toBe(200);

        expect(response.body[0]).toMatchObject({
            deviceId: "GREENHOUSE_TEST",
            status: "OFFLINE"
        });
    });

});