import { getActuatorState, sendDeviceStatus } from "./deviceService.js";
import { getOutsideWeather } from "./weatherService.js";
import simulationConfig from "../config/simulationConfig.js";

const sensors = [
    {
        id: 1,
        type: "TEMPERATURE",
        currentValue: simulationConfig.sensors.temperature.initialValue,
    },
    {
        id: 2,
        type: "HUMIDITY",
        currentValue: simulationConfig.sensors.humidity.initialValue,
    },
    {
        id: 3,
        type: "SOIL_MOISTURE",
        currentValue: simulationConfig.sensors.soilMoisture.initialValue,
    },
    {
        id: 4,
        type: "LIGHT",
        currentValue: simulationConfig.sensors.light.initialValue,
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
    const config = simulationConfig.sensors.light.naturalLight;

    if (
        hour >= config.night.startHour ||
        hour < config.night.endHour
    ) {
        return config.night.value;
    }

    if (
        hour >= config.morning.startHour &&
        hour < config.morning.endHour
    ) {
        return interpolateLight(hour, config.morning);
    }

    if (
        hour >= config.lateMorning.startHour &&
        hour < config.lateMorning.endHour
    ) {
        return interpolateLight(hour, config.lateMorning);
    }

    if (
        hour >= config.afternoon.startHour &&
        hour < config.afternoon.endHour
    ) {
        return interpolateLight(hour, config.afternoon);
    }

    if (
        hour >= config.evening.startHour &&
        hour < config.evening.endHour
    ) {
        return interpolateLight(hour, config.evening);
    }

    return interpolateLight(hour, config.sunset);
}

function interpolateLight(hour, period) {
    const progress =
        (hour - period.startHour) /
        (period.endHour - period.startHour);

    return (
        period.startValue +
        (period.endValue - period.startValue) * progress
    );
}

function generateNextValue(sensor, weather) {
    switch (sensor.type) {
        case "TEMPERATURE": {
            const fan = getActuatorState(2);
            const growLight = getActuatorState(3);

            const config =
                simulationConfig.sensors.temperature;

            const temperatureDifference =
                weather.temperature - sensor.currentValue;

            sensor.currentValue +=
                temperatureDifference *
                config.outsideInfluence;

            if (fan.state === "ON") {
                sensor.currentValue -= randomVariation(
                    config.fanEffect.min,
                    config.fanEffect.max
                );
            }

            if (growLight.state === "ON") {
                sensor.currentValue += randomVariation(
                    config.growLightEffect.min,
                    config.growLightEffect.max
                );
            }

            sensor.currentValue += randomVariation(
                config.randomVariation.min,
                config.randomVariation.max
            );

            return clamp(
                sensor.currentValue,
                config.min,
                config.max
            );
        }

        case "HUMIDITY": {
            const fan = getActuatorState(2);
            const pump = getActuatorState(1);
            const growLight = getActuatorState(3);

            const config =
                simulationConfig.sensors.humidity;

            const humidityDifference =
                weather.humidity - sensor.currentValue;

            sensor.currentValue +=
                humidityDifference *
                config.outsideInfluence;

            if (pump.state === "ON") {
                sensor.currentValue += randomVariation(
                    config.pumpEffect.min,
                    config.pumpEffect.max
                );
            }

            if (fan.state === "ON") {
                sensor.currentValue -= randomVariation(
                    config.fanEffect.min,
                    config.fanEffect.max
                );
            }

            if (growLight.state === "ON") {
                sensor.currentValue -= randomVariation(
                    config.growLightEffect.min,
                    config.growLightEffect.max
                );
            }

            sensor.currentValue += randomVariation(
                config.randomVariation.min,
                config.randomVariation.max
            );

            return clamp(
                sensor.currentValue,
                config.min,
                config.max
            );
        }

        case "SOIL_MOISTURE": {
            const pump = getActuatorState(1);
            const growLight = getActuatorState(3);

            const config =
                simulationConfig.sensors.soilMoisture;

            if (pump.state === "ON") {
                sensor.currentValue += randomVariation(
                    config.pumpEffect.min,
                    config.pumpEffect.max
                );
            } else {
                sensor.currentValue += randomVariation(
                    config.naturalDrying.min,
                    config.naturalDrying.max
                );
            }

            if (growLight.state === "ON") {
                sensor.currentValue -=
                    config.growLightEffect;
            }

            return clamp(
                sensor.currentValue,
                config.min,
                config.max
            );
        }

        case "LIGHT": {
            const growLight = getActuatorState(3);

            const config =
                simulationConfig.sensors.light;

            const naturalLight = getNaturalLight();

            let targetLight = naturalLight;

            if (growLight.state === "ON") {
                targetLight += config.growLightEffect;
            }

            const lightDifference =
                targetLight - sensor.currentValue;

            sensor.currentValue +=
                lightDifference *
                config.responseRate;

            sensor.currentValue += randomVariation(
                config.randomVariation.min,
                config.randomVariation.max
            );

            return clamp(
                sensor.currentValue,
                config.min,
                config.max
            );
        }
    }
}

function clamp(value, min, max) {
    return Math.min(
        Math.max(value, min),
        max
    );
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

    const rules =
        simulationConfig.automaticRules;

    if (
        pump.controlMode === "AUTO" &&
        soilSensor
    ) {
        if (
            soilSensor.currentValue <
                rules.pump.turnOnBelow &&
            pump.state === "OFF"
        ) {
            pump.state = "ON";

            console.log(
                `Pump: OFF → ON (soil moisture: ${soilSensor.currentValue.toFixed(2)}%)`
            );
        }

        if (
            soilSensor.currentValue >=
                rules.pump.turnOffAtOrAbove &&
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
            temperatureSensor.currentValue >
                rules.fan.turnOnAbove.temperature ||
            humiditySensor.currentValue >
                rules.fan.turnOnAbove.humidity;

        const shouldTurnOff =
            temperatureSensor.currentValue <
                rules.fan.turnOffBelow.temperature &&
            humiditySensor.currentValue <
                rules.fan.turnOffBelow.humidity;

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
            hour >=
                rules.growLight.operatingWindow.startHour &&
            hour <
                rules.growLight.operatingWindow.endHour;

        if (!withinOperatingWindow) {
            if (growLight.state === "ON") {
                growLight.state = "OFF";

                console.log(
                    "Grow light: ON → OFF (outside operating window)"
                );
            }
        } else {
            if (
                lightSensor.currentValue <
                    rules.growLight.turnOnBelow &&
                growLight.state === "OFF"
            ) {
                growLight.state = "ON";

                console.log(
                    `Grow light: OFF → ON (light: ${lightSensor.currentValue.toFixed(2)} lux)`
                );
            }

            if (
                lightSensor.currentValue >=
                    rules.growLight.turnOffAtOrAbove &&
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