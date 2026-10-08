import request from "supertest";

import app from "../src/app.js";

import { db } from "../src/database/connection.js";

import {
    resetTestDatabase,
    seedTestDatabase
} from "./fixtures/database.js";

describe("Device API", () => {
    beforeEach(async () => {
        await resetTestDatabase();
        await seedTestDatabase();
    });

    it("POST /api/device/readings should create a batch of readings", async () => {
        const [sensorRows] = await db.query(
            `
        SELECT
            id,
            type
        FROM sensors
        ORDER BY id
        `
        );

        const sensors = sensorRows as {
            id: number;
            type: string;
        }[];

        expect(sensors).toHaveLength(4);

        const temperatureSensor = sensors.find(
            sensor => sensor.type === "TEMPERATURE"
        );

        const humiditySensor = sensors.find(
            sensor => sensor.type === "HUMIDITY"
        );

        const soilMoistureSensor = sensors.find(
            sensor => sensor.type === "SOIL_MOISTURE"
        );

        const lightSensor = sensors.find(
            sensor => sensor.type === "LIGHT"
        );

        expect(temperatureSensor).toBeDefined();
        expect(humiditySensor).toBeDefined();
        expect(soilMoistureSensor).toBeDefined();
        expect(lightSensor).toBeDefined();

        const response = await request(app)
            .post("/api/device/readings")
            .set("X-API-Key", "test-device-api-key")
            .send({
                deviceId: "GREENHOUSE_TEST",
                readings: [
                    {
                        sensorId: temperatureSensor!.id,
                        value: 24.5,
                        unit: "°C",
                        timestamp: "2026-10-07T18:00:00.000Z"
                    },
                    {
                        sensorId: humiditySensor!.id,
                        value: 68,
                        unit: "%",
                        timestamp: "2026-10-07T18:00:00.000Z"
                    },
                    {
                        sensorId: soilMoistureSensor!.id,
                        value: 42,
                        unit: "%",
                        timestamp: "2026-10-07T18:00:00.000Z"
                    },
                    {
                        sensorId: lightSensor!.id,
                        value: 12500,
                        unit: "lux",
                        timestamp: "2026-10-07T18:00:00.000Z"
                    }
                ]
            });

        expect(response.status).toBe(201);

        const [readingRows] = await db.query(
            `
        SELECT
            sensor_id AS sensorId,
            value,
            unit
        FROM readings
        ORDER BY sensor_id
        `
        );

        const readings = readingRows as {
            sensorId: number;
            value: number;
            unit: string;
        }[];

        expect(readings).toHaveLength(4);

        expect(readings).toEqual(
            expect.arrayContaining([
                {
                    sensorId: temperatureSensor!.id,
                    value: 24.5,
                    unit: "°C"
                },
                {
                    sensorId: humiditySensor!.id,
                    value: 68,
                    unit: "%"
                },
                {
                    sensorId: soilMoistureSensor!.id,
                    value: 42,
                    unit: "%"
                },
                {
                    sensorId: lightSensor!.id,
                    value: 12500,
                    unit: "lux"
                }
            ])
        );

        const [updatedSensorRows] = await db.query(
            `
        SELECT
            id,
            current_value AS currentValue
        FROM sensors
        ORDER BY id
        `
        );

        const updatedSensors = updatedSensorRows as {
            id: number;
            currentValue: number;
        }[];

        expect(updatedSensors).toEqual(
            expect.arrayContaining([
                {
                    id: temperatureSensor!.id,
                    currentValue: 24.5
                },
                {
                    id: humiditySensor!.id,
                    currentValue: 68
                },
                {
                    id: soilMoistureSensor!.id,
                    currentValue: 42
                },
                {
                    id: lightSensor!.id,
                    currentValue: 12500
                }
            ])
        );
    });

    it("POST /api/device/readings should reject a sensor from another device", async () => {
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
                "unused-api-key-hash"
            ]
        );

        const otherDeviceId = (
            deviceResult as { insertId: number }
        ).insertId;

        const [sensorResult] = await db.query(
            `
        INSERT INTO sensors (
            device_id,
            name,
            type,
            status,
            sampling_interval,
            current_value,
            last_update,
            zone_id
        )
        VALUES (?, ?, 'TEMPERATURE', 'ONLINE', 60, 22, NOW(), 1)
        `,
            [
                otherDeviceId,
                "Other Temperature"
            ]
        );

        const otherSensorId = (
            sensorResult as { insertId: number }
        ).insertId;

        const response = await request(app)
            .post("/api/device/readings")
            .set("X-API-Key", "test-device-api-key")
            .send({
                deviceId: "GREENHOUSE_TEST",
                readings: [
                    {
                        sensorId: otherSensorId,
                        value: 25,
                        unit: "°C",
                        timestamp: "2026-10-07T18:00:00.000Z"
                    }
                ]
            });

        expect(response.status).toBe(400);

        expect(response.body).toEqual({
            message: "Sensor does not belong to device"
        });

        const [rows] = await db.query(
            `
        SELECT COUNT(*) AS count
        FROM readings
        WHERE sensor_id = ?
        `,
            [otherSensorId]
        );

        const result = rows as {
            count: number;
        }[];

        expect(result[0].count).toBe(0);
    });

    it("POST /api/device/readings should reject a request without an API key", async () => {
        const response = await request(app)
            .post("/api/device/readings")
            .send({
                deviceId: "GREENHOUSE_TEST",
                readings: [
                    {
                        sensorId: 1,
                        value: 24.5,
                        unit: "°C",
                        timestamp: "2026-10-07T18:00:00.000Z"
                    }
                ]
            });

        expect(response.status).toBe(401);

        expect(response.body).toEqual({
            message: "Authentication required"
        });

        const [rows] = await db.query(
            "SELECT COUNT(*) AS count FROM readings"
        );

        const result = rows as {
            count: number;
        }[];

        expect(result[0].count).toBe(0);
    });

    it("POST /api/device/readings should reject an invalid API key", async () => {
        const response = await request(app)
            .post("/api/device/readings")
            .set("X-API-Key", "wrong-api-key")
            .send({
                deviceId: "GREENHOUSE_TEST",
                readings: [
                    {
                        sensorId: 1,
                        value: 24.5,
                        unit: "°C",
                        timestamp: "2026-10-07T18:00:00.000Z"
                    }
                ]
            });

        expect(response.status).toBe(401);

        expect(response.body).toEqual({
            message: "Invalid authentication credentials"
        });

        const [rows] = await db.query(
            "SELECT COUNT(*) AS count FROM readings"
        );

        const result = rows as {
            count: number;
        }[];

        expect(result[0].count).toBe(0);
    });

    it("POST /api/device/readings should reject an empty readings array", async () => {
        const response = await request(app)
            .post("/api/device/readings")
            .set("X-API-Key", "test-device-api-key")
            .send({
                deviceId: "GREENHOUSE_TEST",
                readings: []
            });

        expect(response.status).toBe(400);

        expect(response.body).toEqual({
            message: "readings must contain at least one reading"
        });

        const [rows] = await db.query(
            "SELECT COUNT(*) AS count FROM readings"
        );

        const result = rows as {
            count: number;
        }[];

        expect(result[0].count).toBe(0);
    });

    it("POST /api/device/readings should reject a reading with an out-of-range value", async () => {
        const [sensorRows] = await db.query(
            `
        SELECT
            id
        FROM sensors
        WHERE type = 'TEMPERATURE'
        LIMIT 1
        `
        );

        const sensors = sensorRows as {
            id: number;
        }[];

        expect(sensors).toHaveLength(1);

        const response = await request(app)
            .post("/api/device/readings")
            .set("X-API-Key", "test-device-api-key")
            .send({
                deviceId: "GREENHOUSE_TEST",
                readings: [
                    {
                        sensorId: sensors[0].id,
                        value: 55,
                        unit: "°C",
                        timestamp: "2026-10-07T18:00:00.000Z"
                    }
                ]
            });

        expect(response.status).toBe(400);

        const [rows] = await db.query(
            "SELECT COUNT(*) AS count FROM readings"
        );

        const result = rows as {
            count: number;
        }[];

        expect(result[0].count).toBe(0);
    });

    it("POST /api/device/readings should reject a reading with an invalid unit", async () => {
        const [sensorRows] = await db.query(
            `
        SELECT
            id
        FROM sensors
        WHERE type = 'TEMPERATURE'
        LIMIT 1
        `
        );

        const sensors = sensorRows as {
            id: number;
        }[];

        expect(sensors).toHaveLength(1);

        const response = await request(app)
            .post("/api/device/readings")
            .set("X-API-Key", "test-device-api-key")
            .send({
                deviceId: "GREENHOUSE_TEST",
                readings: [
                    {
                        sensorId: sensors[0].id,
                        value: 24,
                        unit: "%",
                        timestamp: "2026-10-07T18:00:00.000Z"
                    }
                ]
            });

        expect(response.status).toBe(400);

        expect(response.body.message).toBe(
            `Invalid unit for sensor ${sensors[0].id}`
        );

        const [rows] = await db.query(
            "SELECT COUNT(*) AS count FROM readings"
        );

        const result = rows as {
            count: number;
        }[];

        expect(result[0].count).toBe(0);
    });

    it("POST /api/device/readings should reject a reading with an invalid timestamp", async () => {
        const [sensorRows] = await db.query(
            `
        SELECT
            id
        FROM sensors
        WHERE type = 'TEMPERATURE'
        LIMIT 1
        `
        );

        const sensors = sensorRows as {
            id: number;
        }[];

        expect(sensors).toHaveLength(1);

        const response = await request(app)
            .post("/api/device/readings")
            .set("X-API-Key", "test-device-api-key")
            .send({
                deviceId: "GREENHOUSE_TEST",
                readings: [
                    {
                        sensorId: sensors[0].id,
                        value: 24,
                        unit: "°C",
                        timestamp: "not-a-valid-timestamp"
                    }
                ]
            });

        expect(response.status).toBe(400);

        const [rows] = await db.query(
            "SELECT COUNT(*) AS count FROM readings"
        );

        const result = rows as {
            count: number;
        }[];

        expect(result[0].count).toBe(0);
    });

    it("GET /api/device/commands should return pending commands for the device", async () => {
        const [actuatorRows] = await db.query(
            `
        SELECT
            id
        FROM actuators
        WHERE device_id = (
            SELECT id
            FROM devices
            WHERE device_id = ?
        )
        ORDER BY id
        LIMIT 1
        `,
            ["GREENHOUSE_TEST"]
        );

        const actuators = actuatorRows as {
            id: number;
        }[];

        expect(actuators).toHaveLength(1);

        const [commandResult] = await db.query(
            `
        INSERT INTO commands (
            device_id,
            actuator_id,
            type,
            state,
            status
        )
        VALUES (
            (
                SELECT id
                FROM devices
                WHERE device_id = ?
            ),
            ?,
            'SET_ACTUATOR_STATE',
            'ON',
            'PENDING'
        )
        `,
            [
                "GREENHOUSE_TEST",
                actuators[0].id
            ]
        );

        const commandId = (
            commandResult as { insertId: number }
        ).insertId;

        const response = await request(app)
            .get("/api/device/commands")
            .query({
                deviceId: "GREENHOUSE_TEST"
            })
            .set("X-API-Key", "test-device-api-key");

        expect(response.status).toBe(200);

        expect(response.body.commands).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    id: commandId,
                    type: "SET_ACTUATOR_STATE",
                    state: "ON",
                    status: "PENDING"
                })
            ])
        );
    });

    it("GET /api/device/commands should return pending commands for the device", async () => {
        const [actuatorRows] = await db.query(
            `
        SELECT
            id
        FROM actuators
        WHERE device_id = (
            SELECT id
            FROM devices
            WHERE device_id = ?
        )
        ORDER BY id
        LIMIT 1
        `,
            ["GREENHOUSE_TEST"]
        );

        const actuators = actuatorRows as {
            id: number;
        }[];

        expect(actuators).toHaveLength(1);

        const [commandResult] = await db.query(
            `
        INSERT INTO commands (
            device_id,
            actuator_id,
            type,
            state,
            status
        )
        VALUES (
            (
                SELECT id
                FROM devices
                WHERE device_id = ?
            ),
            ?,
            'SET_ACTUATOR_STATE',
            'ON',
            'PENDING'
        )
        `,
            [
                "GREENHOUSE_TEST",
                actuators[0].id
            ]
        );

        const commandId = (
            commandResult as { insertId: number }
        ).insertId;

        const response = await request(app)
            .get("/api/device/commands")
            .query({
                deviceId: "GREENHOUSE_TEST"
            })
            .set("X-API-Key", "test-device-api-key");

        expect(response.status).toBe(200);

        expect(response.body.commands).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    id: commandId,
                    type: "SET_ACTUATOR_STATE",
                    state: "ON",
                    status: "PENDING"
                })
            ])
        );
    });

    it("GET /api/device/commands should return pending commands for the device", async () => {
        const [actuatorRows] = await db.query(
            `
        SELECT
            id
        FROM actuators
        WHERE device_id = (
            SELECT id
            FROM devices
            WHERE device_id = ?
        )
        ORDER BY id
        LIMIT 1
        `,
            ["GREENHOUSE_TEST"]
        );

        const actuators = actuatorRows as {
            id: number;
        }[];

        expect(actuators).toHaveLength(1);

        const [commandResult] = await db.query(
            `
        INSERT INTO commands (
            device_id,
            actuator_id,
            type,
            state,
            status
        )
        VALUES (
            (
                SELECT id
                FROM devices
                WHERE device_id = ?
            ),
            ?,
            'SET_ACTUATOR_STATE',
            'ON',
            'PENDING'
        )
        `,
            [
                "GREENHOUSE_TEST",
                actuators[0].id
            ]
        );

        const commandId = (
            commandResult as { insertId: number }
        ).insertId;

        const response = await request(app)
            .get("/api/device/commands")
            .query({
                deviceId: "GREENHOUSE_TEST"
            })
            .set("X-API-Key", "test-device-api-key");

        expect(response.status).toBe(200);

        expect(response.body.commands).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    id: commandId,
                    type: "SET_ACTUATOR_STATE",
                    state: "ON",
                    status: "PENDING"
                })
            ])
        );
    });

    it("GET /api/device/commands should return only commands belonging to the authenticated device", async () => {
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
                "unused-api-key-hash"
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

        const [commandResult] = await db.query(
            `
        INSERT INTO commands (
            device_id,
            actuator_id,
            type,
            state,
            status
        )
        VALUES (?, ?, 'SET_ACTUATOR_STATE', 'ON', 'PENDING')
        `,
            [
                otherDeviceId,
                otherActuatorId
            ]
        );

        const otherCommandId = (
            commandResult as { insertId: number }
        ).insertId;

        const response = await request(app)
            .get("/api/device/commands")
            .query({
                deviceId: "GREENHOUSE_TEST"
            })
            .set("X-API-Key", "test-device-api-key");

        expect(response.status).toBe(200);

        expect(response.body.commands).not.toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    id: otherCommandId
                })
            ])
        );
    });

    it("GET /api/device/commands should return only commands belonging to the authenticated device", async () => {
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
                "unused-api-key-hash"
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

        const [commandResult] = await db.query(
            `
        INSERT INTO commands (
            device_id,
            actuator_id,
            type,
            state,
            status
        )
        VALUES (?, ?, 'SET_ACTUATOR_STATE', 'ON', 'PENDING')
        `,
            [
                otherDeviceId,
                otherActuatorId
            ]
        );

        const otherCommandId = (
            commandResult as { insertId: number }
        ).insertId;

        const response = await request(app)
            .get("/api/device/commands")
            .query({
                deviceId: "GREENHOUSE_TEST"
            })
            .set("X-API-Key", "test-device-api-key");

        expect(response.status).toBe(200);

        expect(response.body.commands).not.toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    id: otherCommandId
                })
            ])
        );
    });

    it("POST /api/device/command-results should mark a command as failed", async () => {
        const [actuatorRows] = await db.query(
            `
        SELECT
            id
        FROM actuators
        WHERE device_id = (
            SELECT id
            FROM devices
            WHERE device_id = ?
        )
        ORDER BY id
        LIMIT 1
        `,
            ["GREENHOUSE_TEST"]
        );

        const actuators = actuatorRows as {
            id: number;
        }[];

        expect(actuators).toHaveLength(1);

        const actuatorId = actuators[0].id;

        const [commandResult] = await db.query(
            `
        INSERT INTO commands (
            device_id,
            actuator_id,
            type,
            state,
            status
        )
        VALUES (
            (
                SELECT id
                FROM devices
                WHERE device_id = ?
            ),
            ?,
            'SET_ACTUATOR_STATE',
            'ON',
            'PENDING'
        )
        `,
            [
                "GREENHOUSE_TEST",
                actuatorId
            ]
        );

        const commandId = (
            commandResult as { insertId: number }
        ).insertId;

        const response = await request(app)
            .post("/api/device/command-results")
            .set("X-API-Key", "test-device-api-key")
            .send({
                commandId,
                deviceId: "GREENHOUSE_TEST",
                success: false
            });

        expect(response.status).toBe(200);

        expect(response.body).toEqual({
            message: "Command result received"
        });

        const [commandRows] = await db.query(
            `
        SELECT
            status,
            completed_at AS completedAt
        FROM commands
        WHERE id = ?
        `,
            [commandId]
        );

        const commands = commandRows as {
            status: string;
            completedAt: Date | null;
        }[];

        expect(commands).toHaveLength(1);
        expect(commands[0].status).toBe("FAILED");
        expect(commands[0].completedAt).not.toBeNull();

        const [actuatorRowsAfter] = await db.query(
            `
        SELECT
            state
        FROM actuators
        WHERE id = ?
        `,
            [actuatorId]
        );

        const actuatorsAfter = actuatorRowsAfter as {
            state: string;
        }[];

        expect(actuatorsAfter).toHaveLength(1);
        expect(actuatorsAfter[0].state).toBe("OFF");
    });

    it("POST /api/device/command-results should reject a request without an API key", async () => {
        const response = await request(app)
            .post("/api/device/command-results")
            .send({
                commandId: 1,
                deviceId: "GREENHOUSE_TEST",
                success: true
            });

        expect(response.status).toBe(401);

        expect(response.body).toEqual({
            message: "Authentication required"
        });
    });

    it("POST /api/device/command-results should reject an invalid API key", async () => {
        const response = await request(app)
            .post("/api/device/command-results")
            .set("X-API-Key", "wrong-api-key")
            .send({
                commandId: 1,
                deviceId: "GREENHOUSE_TEST",
                success: true
            });

        expect(response.status).toBe(401);

        expect(response.body).toEqual({
            message: "Invalid authentication credentials"
        });
    });

    it("POST /api/device/command-results should reject a command belonging to another device", async () => {
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
                "unused-api-key-hash"
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

        const [commandResult] = await db.query(
            `
        INSERT INTO commands (
            device_id,
            actuator_id,
            type,
            state,
            status
        )
        VALUES (?, ?, 'SET_ACTUATOR_STATE', 'ON', 'PENDING')
        `,
            [
                otherDeviceId,
                otherActuatorId
            ]
        );

        const otherCommandId = (
            commandResult as { insertId: number }
        ).insertId;

        const response = await request(app)
            .post("/api/device/command-results")
            .set("X-API-Key", "test-device-api-key")
            .send({
                commandId: otherCommandId,
                deviceId: "GREENHOUSE_TEST",
                success: true
            });

        expect(response.status).toBe(404);

        expect(response.body).toEqual({
            message: "Command not found or does not belong to device"
        });

        const [rows] = await db.query(
            `
        SELECT
            status
        FROM commands
        WHERE id = ?
        `,
            [otherCommandId]
        );

        const commands = rows as {
            status: string;
        }[];

        expect(commands).toHaveLength(1);
        expect(commands[0].status).toBe("PENDING");
    });

    it("POST /api/device/status should update actuator states", async () => {
        const [actuatorRows] = await db.query(
            `
        SELECT
            id,
            type
        FROM actuators
        WHERE device_id = (
            SELECT id
            FROM devices
            WHERE device_id = ?
        )
        ORDER BY id
        `,
            ["GREENHOUSE_TEST"]
        );

        const actuators = actuatorRows as {
            id: number;
            type: string;
        }[];

        expect(actuators).toHaveLength(3);

        const waterPump = actuators.find(
            actuator => actuator.type === "WATER_PUMP"
        );

        const ventilationFan = actuators.find(
            actuator => actuator.type === "VENTILATION_FAN"
        );

        const growLight = actuators.find(
            actuator => actuator.type === "GROW_LIGHT"
        );

        expect(waterPump).toBeDefined();
        expect(ventilationFan).toBeDefined();
        expect(growLight).toBeDefined();

        const response = await request(app)
            .post("/api/device/status")
            .set("X-API-Key", "test-device-api-key")
            .send({
                deviceId: "GREENHOUSE_TEST",
                actuators: [
                    {
                        actuatorId: waterPump!.id,
                        state: "ON",
                        controlMode: "AUTO"
                    },
                    {
                        actuatorId: ventilationFan!.id,
                        state: "ON",
                        controlMode: "MANUAL"
                    },
                    {
                        actuatorId: growLight!.id,
                        state: "OFF",
                        controlMode: "AUTO"
                    }
                ]
            });

        expect(response.status).toBe(200);

        expect(response.body).toEqual({
            message: "Device status updated"
        });

        const [rows] = await db.query(
            `
        SELECT
            id,
            state,
            control_mode AS controlMode
        FROM actuators
        WHERE device_id = (
            SELECT id
            FROM devices
            WHERE device_id = ?
        )
        ORDER BY id
        `,
            ["GREENHOUSE_TEST"]
        );

        const updatedActuators = rows as {
            id: number;
            state: string;
            controlMode: string;
        }[];

        expect(updatedActuators).toEqual(
            expect.arrayContaining([
                {
                    id: waterPump!.id,
                    state: "ON",
                    controlMode: "AUTO"
                },
                {
                    id: ventilationFan!.id,
                    state: "ON",
                    controlMode: "MANUAL"
                },
                {
                    id: growLight!.id,
                    state: "OFF",
                    controlMode: "AUTO"
                }
            ])
        );
    });

    it("POST /api/device/status should reject a request without an API key", async () => {
        const response = await request(app)
            .post("/api/device/status")
            .send({
                deviceId: "GREENHOUSE_TEST",
                actuators: []
            });

        expect(response.status).toBe(401);

        expect(response.body).toEqual({
            message: "Authentication required"
        });
    });

    it("POST /api/device/status should reject an invalid API key", async () => {
        const response = await request(app)
            .post("/api/device/status")
            .set("X-API-Key", "wrong-api-key")
            .send({
                deviceId: "GREENHOUSE_TEST",
                actuators: []
            });

        expect(response.status).toBe(401);

        expect(response.body).toEqual({
            message: "Invalid authentication credentials"
        });
    });

    it("POST /api/device/status should reject a request without actuators", async () => {
        const response = await request(app)
            .post("/api/device/status")
            .set("X-API-Key", "test-device-api-key")
            .send({
                deviceId: "GREENHOUSE_TEST"
            });

        expect(response.status).toBe(400);

        expect(response.body).toEqual({
            message: "actuators must be an array"
        });
    });

    it("GET /api/device/config should return the device configuration", async () => {
        const response = await request(app)
            .get("/api/device/config")
            .query({
                deviceId: "GREENHOUSE_TEST"
            })
            .set("X-API-Key", "test-device-api-key");

        expect(response.status).toBe(200);

        expect(response.body.deviceId).toBe("GREENHOUSE_TEST");

        expect(response.body.actuators).toHaveLength(3);

        expect(response.body.actuators).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    state: "OFF",
                    controlMode: "AUTO"
                }),
                expect.objectContaining({
                    state: "OFF",
                    controlMode: "AUTO"
                }),
                expect.objectContaining({
                    state: "OFF",
                    controlMode: "AUTO"
                })
            ])
        );

        expect(
            response.body.actuators.every(
                (actuator: { actuatorId: number }) =>
                    typeof actuator.actuatorId === "number"
            )
        ).toBe(true);
    });

    it("GET /api/device/config should reject access to another device", async () => {
        const response = await request(app)
            .get("/api/device/config")
            .query({
                deviceId: "OTHER_DEVICE"
            })
            .set("X-API-Key", "test-device-api-key");

        expect(response.status).toBe(401);
    });

    it("GET /api/device/config should reject a request without deviceId", async () => {
        const response = await request(app)
            .get("/api/device/config")
            .set("X-API-Key", "test-device-api-key");

        expect(response.status).toBe(401);

        expect(response.body).toEqual({
            message: "Authentication required"
        });
    });

    it("POST /api/device/status should reject an invalid actuator status", async () => {
        const response = await request(app)
            .post("/api/device/status")
            .set("X-API-Key", "test-device-api-key")
            .send({
                deviceId: "GREENHOUSE_TEST",
                actuators: [
                    {
                        actuatorId: "invalid",
                        state: "ON",
                        controlMode: "AUTO"
                    }
                ]
            });

        expect(response.status).toBe(400);

        expect(response.body).toEqual({
            message: "Invalid actuator status"
        });
    });

});