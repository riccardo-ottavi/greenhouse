
import request from "supertest";

import app from "../src/app.js";
import { db } from "../src/database/connection.js";

import {
    resetTestDatabase,
    seedTestDatabase
} from "./fixtures/database.js";

describe("Readings API", () => {
    beforeEach(async () => {
        await resetTestDatabase();
        await seedTestDatabase();
    });

    it("GET /api/readings should return all readings", async () => {
        const response = await request(app)
            .get("/api/readings");

        expect(response.status).toBe(200);
        expect(response.body).toHaveLength(0);
    });

    it("GET /api/readings/:id should return a reading", async () => {
        const sensorsResponse = await request(app)
            .get("/api/sensors");

        const sensor = sensorsResponse.body.find(
            (item: { type: string }) =>
                item.type === "TEMPERATURE"
        );

        expect(sensor).toBeDefined();

        const createResponse = await request(app)
            .post("/api/device/readings")
            .set("X-API-Key", "test-device-api-key")
            .send({
                deviceId: "GREENHOUSE_TEST",
                readings: [
                    {
                        sensorId: sensor.id,
                        value: 23.5,
                        unit: "°C",
                        timestamp: new Date().toISOString()
                    }
                ]
            });

        expect(createResponse.status).toBe(201);

        const [rows] = await db.query(
            `
            SELECT id
            FROM readings
            WHERE sensor_id = ?
            ORDER BY id DESC
            LIMIT 1
            `,
            [sensor.id]
        );

        const readings = rows as { id: number }[];

        expect(readings).toHaveLength(1);

        const readingId = readings[0].id;

        const response = await request(app)
            .get(`/api/readings/${readingId}`);

        expect(response.status).toBe(200);

        expect(response.body).toMatchObject({
            id: readingId,
            sensorId: sensor.id,
            value: 23.5,
            unit: "°C"
        });
    });

    it("GET /api/readings/:id should return 404 for an unknown reading", async () => {
        const response = await request(app)
            .get("/api/readings/999999");

        expect(response.status).toBe(404);

        expect(response.body).toEqual({
            message: "Reading not found"
        });
    });

    it("POST /api/readings should return 404 without creating a reading", async () => {
        const sensorsResponse = await request(app)
            .get("/api/sensors");

        const sensor = sensorsResponse.body.find(
            (item: { type: string }) =>
                item.type === "TEMPERATURE"
        );

        expect(sensor).toBeDefined();

        const response = await request(app)
            .post("/api/readings")
            .send({
                sensorId: sensor.id,
                value: 26.5,
                unit: "°C",
                timestamp: new Date().toISOString()
            });

        expect(response.status).toBe(404);

        const [readingRows] = await db.query(
            "SELECT COUNT(*) AS count FROM readings"
        );

        const readings = readingRows as { count: number }[];

        expect(Number(readings[0].count)).toBe(0);

        const sensorResponse = await request(app)
            .get(`/api/sensors/${sensor.id}`);

        expect(sensorResponse.status).toBe(200);
        expect(sensorResponse.body.currentValue).toBe(22);
    });

    it("POST /api/device/readings should update the sensor current value", async () => {
        const sensorsResponse = await request(app)
            .get("/api/sensors");

        const sensor = sensorsResponse.body.find(
            (item: { type: string }) =>
                item.type === "TEMPERATURE"
        );

        expect(sensor).toBeDefined();

        const response = await request(app)
            .post("/api/device/readings")
            .set("X-API-Key", "test-device-api-key")
            .send({
                deviceId: "GREENHOUSE_TEST",
                readings: [
                    {
                        sensorId: sensor.id,
                        value: 26.5,
                        unit: "°C",
                        timestamp: new Date().toISOString()
                    }
                ]
            });

        expect(response.status).toBe(201);

        const sensorResponse = await request(app)
            .get(`/api/sensors/${sensor.id}`);

        expect(sensorResponse.status).toBe(200);
        expect(sensorResponse.body.currentValue).toBe(26.5);
    });
});
