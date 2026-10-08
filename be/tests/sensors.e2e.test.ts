import request from "supertest";

import app from "../src/app.js";

import {
    resetTestDatabase,
    seedTestDatabase
} from "./fixtures/database.js";

describe("Sensors API", () => {
    beforeEach(async () => {
        await resetTestDatabase();
        await seedTestDatabase();
    });

    it("GET /api/sensors should return all sensors", async () => {
        const response = await request(app)
            .get("/api/sensors");

        expect(response.status).toBe(200);

        expect(response.body).toHaveLength(4);

        expect(
            response.body.map(
                (sensor: { type: string }) => sensor.type
            )
        ).toEqual(
            expect.arrayContaining([
                "TEMPERATURE",
                "HUMIDITY",
                "SOIL_MOISTURE",
                "LIGHT"
            ])
        );
    });

    it("GET /api/sensors/:id should return a sensor", async () => {
        const listResponse = await request(app)
            .get("/api/sensors");

        const sensor = listResponse.body.find(
            (item: { type: string }) =>
                item.type === "TEMPERATURE"
        );

        const response = await request(app)
            .get(`/api/sensors/${sensor.id}`);

        expect(response.status).toBe(200);

        expect(response.body).toMatchObject({
            id: sensor.id,
            type: "TEMPERATURE",
            currentValue: 22,
            status: "ONLINE",
            alert: null
        });
    });

    it("GET /api/sensors/:id should return 404 for an unknown sensor", async () => {
        const response = await request(app)
            .get("/api/sensors/999999");

        expect(response.status).toBe(404);

        expect(response.body).toEqual({
            message: "Sensor not found"
        });
    });

    it("GET /api/sensors/:id should return an environmental alert", async () => {
    const listResponse = await request(app)
        .get("/api/sensors");

    const sensor = listResponse.body.find(
        (item: { type: string }) =>
            item.type === "SOIL_MOISTURE"
    );

    await request(app)
        .post("/api/readings")
        .send({
            sensorId: sensor.id,
            value: 15,
            unit: "%",
            timestamp: new Date().toISOString()
        });

    const response = await request(app)
        .get(`/api/sensors/${sensor.id}`);

    expect(response.status).toBe(200);

    expect(response.body).toMatchObject({
        id: sensor.id,
        type: "SOIL_MOISTURE",
        currentValue: 15,
        alert: "LOW_SOIL_MOISTURE"
    });
});

});