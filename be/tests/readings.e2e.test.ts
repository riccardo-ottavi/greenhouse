import request from "supertest";

import app from "../src/app.js";

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

        const createResponse = await request(app)
            .post("/api/readings")
            .send({
                sensorId: sensor.id,
                value: 23.5,
                unit: "°C",
                timestamp: new Date().toISOString()
            });

        expect(createResponse.status).toBe(201);

        const readingId = createResponse.body.id;

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

    it("POST /api/readings should update the sensor current value", async () => {
        const sensorsResponse = await request(app)
            .get("/api/sensors");

        const sensor = sensorsResponse.body.find(
            (item: { type: string }) =>
                item.type === "TEMPERATURE"
        );

        const createResponse = await request(app)
            .post("/api/readings")
            .send({
                sensorId: sensor.id,
                value: 26.5,
                unit: "°C",
                timestamp: new Date().toISOString()
            });

        expect(createResponse.status).toBe(201);

        const sensorResponse = await request(app)
            .get(`/api/sensors/${sensor.id}`);

        expect(sensorResponse.status).toBe(200);

        expect(sensorResponse.body.currentValue).toBe(26.5);
    });

    it("POST /api/readings should return 404 for an unknown sensor", async () => {
        const response = await request(app)
            .post("/api/readings")
            .send({
                sensorId: 999999,
                value: 25,
                unit: "°C",
                timestamp: new Date().toISOString()
            });

        expect(response.status).toBe(404);

        expect(response.body).toEqual({
            message: "Sensor not found"
        });
    });
    it("POST /api/readings should reject a temperature outside the valid range", async () => {
        const sensorsResponse = await request(app)
            .get("/api/sensors");

        const sensor = sensorsResponse.body.find(
            (item: { type: string }) =>
                item.type === "TEMPERATURE"
        );

        const response = await request(app)
            .post("/api/readings")
            .send({
                sensorId: sensor.id,
                value: 55,
                unit: "°C",
                timestamp: new Date().toISOString()
            });

        expect(response.status).toBe(400);
    });
    it("POST /api/readings should reject an invalid unit for the sensor type", async () => {
        const sensorsResponse = await request(app)
            .get("/api/sensors");

        const sensor = sensorsResponse.body.find(
            (item: { type: string }) =>
                item.type === "TEMPERATURE"
        );

        const response = await request(app)
            .post("/api/readings")
            .send({
                sensorId: sensor.id,
                value: 25,
                unit: "%",
                timestamp: new Date().toISOString()
            });

        expect(response.status).toBe(400);

        expect(response.body).toEqual({
            message: "Unit does not match sensor type"
        });
    });
});