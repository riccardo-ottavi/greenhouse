
import request from "supertest";

import app from "../src/app.js";
import { db } from "../src/database/connection.js";

import {
    resetTestDatabase,
    seedTestDatabase
} from "./fixtures/database.js";

async function getTemperatureSensorId(): Promise<number> {
    const sensorsResponse = await request(app).get("/api/sensors");

    const sensor = sensorsResponse.body.find(
        (item: { type: string }) => item.type === "TEMPERATURE"
    );

    expect(sensor).toBeDefined();

    return sensor.id;
}

async function insertReading(
    sensorId: number,
    value: number,
    timestamp: Date
): Promise<void> {
    await db.query(
        `
    INSERT INTO readings (sensor_id, value, unit, timestamp)
    VALUES (?, ?, ?, ?)
    `,
        [sensorId, value, "°C", timestamp]
    );
}

describe("Readings API", () => {

    it("GET /api/sensors/:sensorId/readings should return a paginated response", async () => {
        const sensorId = await getTemperatureSensorId();
        const now = Date.now();

        await insertReading(sensorId, 20, new Date(now - 3 * 60_000));
        await insertReading(sensorId, 21, new Date(now - 2 * 60_000));
        await insertReading(sensorId, 22, new Date(now - 1 * 60_000));

        const response = await request(app)
            .get(`/api/sensors/${sensorId}/readings`)
            .query({ range: "all", limit: 2 });

        expect(response.status).toBe(200);
        expect(response.body.readings).toHaveLength(2);
        expect(response.body.hasMore).toBe(true);
        expect(response.body.nextCursor).toEqual(expect.any(String));

        expect(response.body.readings.map(
            (reading: { value: number }) => reading.value
        )).toEqual([22, 21]);
    });

    it("GET /api/sensors/:sensorId/readings should return the next page using the cursor", async () => {
        const sensorId = await getTemperatureSensorId();
        const now = Date.now();

        await insertReading(sensorId, 20, new Date(now - 3 * 60_000));
        await insertReading(sensorId, 21, new Date(now - 2 * 60_000));
        await insertReading(sensorId, 22, new Date(now - 1 * 60_000));

        const firstPage = await request(app)
            .get(`/api/sensors/${sensorId}/readings`)
            .query({ range: "all", limit: 2 });

        expect(firstPage.status).toBe(200);
        expect(firstPage.body.hasMore).toBe(true);

        const secondPage = await request(app)
            .get(`/api/sensors/${sensorId}/readings`)
            .query({
                range: "all",
                limit: 2,
                cursor: firstPage.body.nextCursor
            });

        expect(secondPage.status).toBe(200);
        expect(secondPage.body.readings).toHaveLength(1);
        expect(secondPage.body.hasMore).toBe(false);
        expect(secondPage.body.nextCursor).toBeNull();

        expect(secondPage.body.readings[0].value).toBe(20);

        const firstPageIds = firstPage.body.readings.map(
            (reading: { id: number }) => reading.id
        );

        const secondPageIds = secondPage.body.readings.map(
            (reading: { id: number }) => reading.id
        );

        expect(firstPageIds).not.toContain(secondPageIds[0]);
    });

    it("GET /api/sensors/:sensorId/readings should filter readings by the last 24 hours", async () => {
        const sensorId = await getTemperatureSensorId();
        const now = Date.now();

        await insertReading(sensorId, 18, new Date(now - 25 * 60 * 60 * 1000));
        await insertReading(sensorId, 23, new Date(now - 1 * 60 * 60 * 1000));

        const response = await request(app)
            .get(`/api/sensors/${sensorId}/readings`)
            .query({ range: "24h", limit: 10 });

        expect(response.status).toBe(200);
        expect(response.body.readings).toHaveLength(1);
        expect(response.body.readings[0].value).toBe(23);
        expect(response.body.hasMore).toBe(false);
    });

    it("GET /api/sensors/:sensorId/readings should return 400 for an invalid range", async () => {
        const sensorId = await getTemperatureSensorId();

        const response = await request(app)
            .get(`/api/sensors/${sensorId}/readings`)
            .query({ range: "invalid" });

        expect(response.status).toBe(400);
    });

    it("GET /api/sensors/:sensorId/readings should return 400 for an invalid limit", async () => {
        const sensorId = await getTemperatureSensorId();

        const response = await request(app)
            .get(`/api/sensors/${sensorId}/readings`)
            .query({ range: "all", limit: 0 });

        expect(response.status).toBe(400);
    });

    it("GET /api/sensors/:sensorId/readings should return 400 for an invalid cursor", async () => {
        const sensorId = await getTemperatureSensorId();

        const response = await request(app)
            .get(`/api/sensors/${sensorId}/readings`)
            .query({
                range: "all",
                limit: 10,
                cursor: "not-a-valid-cursor"
            });

        expect(response.status).toBe(400);
    });

    it("GET /api/sensors/:sensorId/readings should return 404 for an unknown sensor", async () => {
        const response = await request(app)
            .get("/api/sensors/999999/readings")
            .query({ range: "all", limit: 10 });

        expect(response.status).toBe(404);
    });

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

    it("GET /api/sensors/:sensorId/readings should return the next page using the cursor", async () => {
        const sensorId = await getTemperatureSensorId();
        const now = Date.now();

        await insertReading(sensorId, 20, new Date(now - 3 * 60_000));
        await insertReading(sensorId, 21, new Date(now - 2 * 60_000));
        await insertReading(sensorId, 22, new Date(now - 1 * 60_000));

        const firstPage = await request(app)
            .get(`/api/sensors/${sensorId}/readings`)
            .query({ range: "all", limit: 2 });

        expect(firstPage.status).toBe(200);
        expect(firstPage.body.hasMore).toBe(true);

        const secondPage = await request(app)
            .get(`/api/sensors/${sensorId}/readings`)
            .query({
                range: "all",
                limit: 2,
                cursor: firstPage.body.nextCursor
            });

        expect(secondPage.status).toBe(200);
        expect(secondPage.body.readings).toHaveLength(1);
        expect(secondPage.body.hasMore).toBe(false);
        expect(secondPage.body.nextCursor).toBeNull();

        expect(secondPage.body.readings[0].value).toBe(20);

        const firstPageIds = firstPage.body.readings.map(
            (reading: { id: number }) => reading.id
        );

        const secondPageIds = secondPage.body.readings.map(
            (reading: { id: number }) => reading.id
        );

        expect(firstPageIds).not.toContain(secondPageIds[0]);
    });

    it("GET /api/sensors/:sensorId/readings should filter readings by the last 24 hours", async () => {
        const sensorId = await getTemperatureSensorId();
        const now = Date.now();

        await insertReading(sensorId, 18, new Date(now - 25 * 60 * 60 * 1000));
        await insertReading(sensorId, 23, new Date(now - 1 * 60 * 60 * 1000));

        const response = await request(app)
            .get(`/api/sensors/${sensorId}/readings`)
            .query({ range: "24h", limit: 10 });

        expect(response.status).toBe(200);
        expect(response.body.readings).toHaveLength(1);
        expect(response.body.readings[0].value).toBe(23);
        expect(response.body.hasMore).toBe(false);
    });

    it("GET /api/sensors/:sensorId/readings should return 400 for an invalid range", async () => {
        const sensorId = await getTemperatureSensorId();

        const response = await request(app)
            .get(`/api/sensors/${sensorId}/readings`)
            .query({ range: "invalid" });

        expect(response.status).toBe(400);
    });

    it("GET /api/sensors/:sensorId/readings should return 400 for an invalid limit", async () => {
        const sensorId = await getTemperatureSensorId();

        const response = await request(app)
            .get(`/api/sensors/${sensorId}/readings`)
            .query({ range: "all", limit: 0 });

        expect(response.status).toBe(400);
    });

    it("GET /api/sensors/:sensorId/readings should return 400 for an invalid cursor", async () => {
        const sensorId = await getTemperatureSensorId();

        const response = await request(app)
            .get(`/api/sensors/${sensorId}/readings`)
            .query({
                range: "all",
                limit: 10,
                cursor: "not-a-valid-cursor"
            });

        expect(response.status).toBe(400);
    });

    it("GET /api/sensors/:sensorId/readings should return 404 for an unknown sensor", async () => {
        const response = await request(app)
            .get("/api/sensors/999999/readings")
            .query({ range: "all", limit: 10 });

        expect(response.status).toBe(404);

    });
});
