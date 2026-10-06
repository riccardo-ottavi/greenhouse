import { getActuatorState, sendDeviceStatus } from "./deviceService.js";
import { getOutsideWeather } from "./weatherService.js";

const sensors = [
    {
        id: 1,
        type: "TEMPERATURE",
        currentValue: 22,
    },
    {
        id: 2,
        type: "HUMIDITY",
        currentValue: 65,
    },
    {
        id: 3,
        type: "SOIL_MOISTURE",
        currentValue: 45,
    },
    {
        id: 4,
        type: "LIGHT",
        currentValue: 10000,
    }
];

export async function runSimulation() {
    const weather = await getOutsideWeather();

    sensors.forEach((sensor) => {
        generateNextValue(sensor, weather);
    });

    applyAutomaticRules();

    try {
        await Promise.all(
            sensors.map(async (sensor) => {
                try {
                    const reading = await sendReading(
                        sensor,
                        sensor.currentValue
                    );

                    console.log(
                        `${sensor.type} - Reading sent:`,
                        reading
                    );
                } catch (error) {
                    console.error(
                        `${sensor.type} - Error sending reading:`,
                        error
                    );
                }
            })
        );
    } catch (error) {
        console.error(
            "Simulation readings error:",
            error
        );
    }

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

function generateNextValue(sensor, weather) {
    switch (sensor.type) {
        case "TEMPERATURE": {
            const fan = getActuatorState(2);
            const growLight = getActuatorState(3);

            const temperatureDifference =
                weather.temperature - sensor.currentValue;

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
                weather.humidity - sensor.currentValue;

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
            const growLight = getActuatorState(3);

            if (pump.state === "ON") {
                sensor.currentValue += randomVariation(0.70, 0.90);
            } else {
                sensor.currentValue += randomVariation(-0.07, -0.03);
            }

            if (growLight.state === "ON") {
                sensor.currentValue -= 0.02;
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
    const fan = getActuatorState(2);
    const growLight = getActuatorState(3);

    const temperatureSensor = sensors.find(
        (sensor) => sensor.id === 1
    );

    const humiditySensor = sensors.find(
        (sensor) => sensor.id === 2
    );

    const soilSensor = sensors.find(
        (sensor) => sensor.id === 3
    );

    const lightSensor = sensors.find(
        (sensor) => sensor.id === 4
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
            console.log(
                `Pump: OFF → ON (soil moisture: ${soilSensor.currentValue.toFixed(2)}%)`
            );
        }

        if (
            soilSensor.currentValue >= 50 &&
            pump.state === "ON"
        ) {
            pump.state = "OFF";
            console.log(
                `Pump: ON → OFF (soil moisture: ${soilSensor.currentValue.toFixed(2)}%)`
            );
        }
    }

    if (
        fan.controlMode === "AUTO" &&
        temperatureSensor &&
        humiditySensor
    ) {
        const shouldTurnOn =
            temperatureSensor.currentValue > 28 ||
            humiditySensor.currentValue > 75;

        const shouldTurnOff =
            temperatureSensor.currentValue < 25 &&
            humiditySensor.currentValue < 70;

        if (
            shouldTurnOn &&
            fan.state === "OFF"
        ) {
            fan.state = "ON";
            console.log(
                `Fan: OFF → ON (temperature: ${temperatureSensor.currentValue.toFixed(2)}°C, humidity: ${humiditySensor.currentValue.toFixed(2)}%)`
            );
        }

        if (
            shouldTurnOff &&
            fan.state === "ON"
        ) {
            fan.state = "OFF";
            console.log(
                `Fan: ON → OFF (temperature: ${temperatureSensor.currentValue.toFixed(2)}°C, humidity: ${humiditySensor.currentValue.toFixed(2)}%)`
            );
        }
    }

    if (
        growLight.controlMode === "AUTO" &&
        lightSensor
    ) {
        const hour = new Date().getHours();

        const withinOperatingWindow =
            hour >= 6 &&
            hour < 20;

        if (!withinOperatingWindow) {
            if (growLight.state === "ON") {
                growLight.state = "OFF";
                console.log(
                    `Grow light: ON → OFF (outside operating window)`
                );
            }
        } else {
            if (
                lightSensor.currentValue < 10000 &&
                growLight.state === "OFF"
            ) {
                growLight.state = "ON";
                console.log(
                    `Grow light: OFF → ON (light: ${lightSensor.currentValue.toFixed(2)} lux)`
                );
            }

            if (
                lightSensor.currentValue >= 15000 &&
                growLight.state === "ON"
            ) {
                growLight.state = "OFF";
                console.log(
                    `Grow light: ON → OFF (light: ${lightSensor.currentValue.toFixed(2)} lux)`
                );
            }
        }
    }
}
