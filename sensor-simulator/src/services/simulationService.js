import { getActuatorState, sendDeviceStatus } from "./deviceService.js";

const outsideTemperature = 18;
const outsideHumidity = 70;

const sensors = [
    {
        id: 1,
        type: "TEMPERATURE",
        currentValue: 23.5,
    },
    {
        id: 2,
        type: "HUMIDITY",
        currentValue: 65,
    },
    {
        id: 3,
        type: "SOIL_MOISTURE",
        currentValue: 29,
    },
    {
        id: 4,
        type: "LIGHT",
        currentValue: 750,
    }
];

export async function runSimulation() {
    sensors.forEach(async (sensor) => {
        const value = generateNextValue(sensor);

        try {
            const reading = await sendReading(sensor, value);
            console.log(`${sensor.type} - Reading sent:`, reading);
        } catch (error) {
            console.error(`${sensor.type} - Error sending reading:`, error);
        }
    });

    applyAutomaticRules();

    try {
        await sendDeviceStatus();
        console.log("Device status sent");
    } catch (error) {
        console.error(
            "Device status error:",
            error.message
        );
    }
}


function randomVariation(min, max) {
    return Math.random() * (max - min) + min;
}

function getNaturalLight() {
    const hour = new Date().getHours();

    if (hour < 6 || hour >= 21) {
        return 0;
    }

    if (hour < 9) {
        return ((hour - 6) / 3) * 10000;
    }

    if (hour < 12) {
        return 10000 + ((hour - 9) / 3) * 15000;
    }

    if (hour < 15) {
        return 25000 - ((hour - 12) / 3) * 5000;
    }

    if (hour < 18) {
        return 20000 - ((hour - 15) / 3) * 15000;
    }

    return 5000 - ((hour - 18) / 3) * 5000;
}

function generateNextValue(sensor) {
    switch (sensor.type) {
        case "TEMPERATURE": {
            const fan = getActuatorState(2);
            const growLight = getActuatorState(3);

            const temperatureDifference =
                outsideTemperature - sensor.currentValue;

            sensor.currentValue += temperatureDifference * 0.10;

            if (fan.state === "ON") {
                sensor.currentValue -= randomVariation(0.12, 0.18);
            }

            if (growLight.state === "ON") {
                sensor.currentValue += randomVariation(0.02, 0.04);
            }

            sensor.currentValue += randomVariation(-0.05, 0.05);

            return clamp(sensor.currentValue, 10, 35);
        }

        case "HUMIDITY": {
            const fan = getActuatorState(2);
            const pump = getActuatorState(1);
            const growLight = getActuatorState(3);

            const humidityDifference =
                outsideHumidity - sensor.currentValue;

            sensor.currentValue += humidityDifference * 0.02;

            if (pump.state === "ON") {
                sensor.currentValue += randomVariation(0.80, 1.20);
            }

            if (fan.state === "ON") {
                sensor.currentValue -= randomVariation(0.25, 0.35);
            }

            if (growLight.state === "ON") {
                sensor.currentValue -= randomVariation(0.03, 0.07);
            }

            sensor.currentValue += randomVariation(-0.05, 0.05);

            return clamp(sensor.currentValue, 20, 95);
        }

        case "SOIL_MOISTURE": {
            const pump = getActuatorState(1);

            if (pump.state === "ON") {
                sensor.currentValue += randomVariation(0.70, 0.90);
            } else {
                sensor.currentValue += randomVariation(-0.07, -0.03);
            }

            return clamp(sensor.currentValue, 10, 90);
        }

        case "LIGHT": {
            const growLight = getActuatorState(3);

            const naturalLight = getNaturalLight();

            let targetLight = naturalLight;

            if (growLight.state === "ON") {
                targetLight += 5000;
            }

            const lightDifference =
                targetLight - sensor.currentValue;

            sensor.currentValue += lightDifference * 0.20;

            sensor.currentValue += randomVariation(-50, 50);

            return clamp(sensor.currentValue, 0, 60000);
        }
    }
}


function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

async function sendReading(sensor, value) {
    const unitBySensorType = {
        TEMPERATURE: "°C",
        HUMIDITY: "%",
        SOIL_MOISTURE: "%",
        LIGHT: "lux"
    };

    const response = await fetch(
        "http://localhost:3000/api/device/readings",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                deviceId: "GREENHOUSE_001",
                readings: [
                    {
                        sensorId: sensor.id,
                        value: value,
                        unit: unitBySensorType[sensor.type],
                        timestamp: new Date().toISOString()
                    }
                ]
            })
        }
    );

    if (!response.ok) {
        throw new Error(
            `Failed to send reading: ${response.status}`
        );
    }

    return await response.json();
}

function applyAutomaticRules() {
    const pump = getActuatorState(1);
    const soilSensor = sensors.find(
        (sensor) => sensor.id === 3
    );

    if (
        pump.controlMode === "AUTO" &&
        soilSensor
    ) {
        if (
            soilSensor.currentValue < 30 &&
            pump.state === "OFF"
        ) {
            pump.state = "ON";
        }

        if (
            soilSensor.currentValue >= 50 &&
            pump.state === "ON"
        ) {
            pump.state = "OFF";
        }
    }
}
