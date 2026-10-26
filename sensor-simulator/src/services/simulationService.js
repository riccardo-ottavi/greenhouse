import { getSimulationTime } from "./simulationClock.js";
import deviceState from "../state/deviceState.js";
import {
    BACKEND_URL,
    sendDeviceStatus,
    sendExternalWeather,
    DEVICE_HEADERS
} from "./deviceService.js";
import { getOutsideWeather } from "./weatherService.js";
import simulationConfig from "../config/simulationConfig.js";
import { reconcileSensors } from "../utils/reconcileSensors.js";
import { updatePhotoperiod } from "./photoperiodService.js";
import { getNaturalLight } from "./naturalLightService.js";

const WEATHER_SEND_INTERVAL = 60 * 1000;

let lastWeatherSentAt = 0;
let sensors = [];

const unitBySensorType = {
    TEMPERATURE: "°C",
    HUMIDITY: "%",
    SOIL_MOISTURE: "%",
    LIGHT: "lux"
};

function initializeSimulationSensors() {
    sensors = reconcileSensors(
        sensors,
        deviceState.sensors,
        simulationConfig
    );
}

function getSensorByType(type) {
    return sensors.find((sensor) => sensor.type === type);
}

function getActuatorByType(type) {
    return Object.values(deviceState.actuators).find(
        (actuator) => actuator.type === type
    );
}

const DEFAULT_SIMULATED_MINUTE_MS = 60 * 1000;

export async function runSimulation(
    simulationTime = getSimulationTime(),
    elapsedSimulatedMs = DEFAULT_SIMULATED_MINUTE_MS
) {
    if (
        !(simulationTime instanceof Date) ||
        !Number.isFinite(simulationTime.getTime())
    ) {
        throw new Error("A valid simulation date is required.");
    }

    if (
        !Number.isFinite(elapsedSimulatedMs) ||
        elapsedSimulatedMs < 0
    ) {
        throw new Error(
            "Elapsed simulated time must be a non-negative number."
        );
    }

    initializeSimulationSensors();

    const weather = await getOutsideWeather();
    const now = Date.now();

    if (now - lastWeatherSentAt >= WEATHER_SEND_INTERVAL) {
        try {
            await sendExternalWeather(weather);
            lastWeatherSentAt = now;

            console.log(
                "External weather sent to backend:",
                weather
            );
        } catch (error) {
            console.error(
                "External weather error:",
                error.message
            );
        }
    }

    const elapsedSimulatedMinutes =
        elapsedSimulatedMs / DEFAULT_SIMULATED_MINUTE_MS;

    const updatedSensorValues = sensors.map((sensor) => ({
        sensor,
        currentValue: generateNextValue(
            { ...sensor },
            weather,
            simulationTime,
            elapsedSimulatedMinutes
        )
    }));

    for (const { sensor, currentValue } of updatedSensorValues) {
        sensor.currentValue = currentValue;
    }

    const growLight = getActuatorByType("GROW_LIGHT");
    let photoperiodStatus = null;

    if (growLight) {
        try {
            photoperiodStatus = await updatePhotoperiod({
                lightIsOn: growLight.state === "ON",
                now: simulationTime
            });
        } catch (error) {
            console.error(
                "Photoperiod error:",
                error.message
            );
        }
    }

    applyAutomaticRules(
        photoperiodStatus,
        simulationTime
    );

    await Promise.all(
        sensors.map(async (sensor) => {
            try {
                const reading = await sendReading(
                    sensor,
                    sensor.currentValue,
                    simulationTime
                );

                console.log(
                    `${sensor.type} - Reading sent:`,
                    reading
                );
            } catch (error) {
                console.error(
                    `${sensor.type} - Error sending reading:`,
                    error.message
                );
            }
        })
    );

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

function scaleCoefficient(coefficient, elapsedMinutes) {
    return 1 - Math.pow(1 - coefficient, elapsedMinutes);
}

function scaledRandomVariation(min, max, elapsedMinutes) {
    return randomVariation(min, max) *
        Math.sqrt(elapsedMinutes);
}

function generateNextValue(
    sensor,
    weather,
    simulationTime,
    elapsedMinutes
) {
    if (elapsedMinutes === 0) {
        return sensor.currentValue;
    }

    switch (sensor.type) {
        case "TEMPERATURE": {
            const fan = getActuatorByType("VENTILATION_FAN");
            const growLight = getActuatorByType("GROW_LIGHT");
            const config = simulationConfig.sensors.temperature;

            const temperatureDifference =
                weather.temperature - sensor.currentValue;

            sensor.currentValue +=
                temperatureDifference *
                scaleCoefficient(
                    config.outsideInfluence,
                    elapsedMinutes
                );

            if (fan?.state === "ON") {
                sensor.currentValue -= randomVariation(
                    config.fanEffect.min,
                    config.fanEffect.max
                ) * elapsedMinutes;
            }

            if (growLight?.state === "ON") {
                sensor.currentValue += randomVariation(
                    config.growLightEffect.min,
                    config.growLightEffect.max
                ) * elapsedMinutes;
            }

            sensor.currentValue += scaledRandomVariation(
                config.randomVariation.min,
                config.randomVariation.max,
                elapsedMinutes
            );

            return clamp(
                sensor.currentValue,
                config.min,
                config.max
            );
        }

        case "HUMIDITY": {
            const fan = getActuatorByType("VENTILATION_FAN");
            const pump = getActuatorByType("WATER_PUMP");
            const growLight = getActuatorByType("GROW_LIGHT");
            const config = simulationConfig.sensors.humidity;

            const humidityDifference =
                weather.humidity - sensor.currentValue;

            sensor.currentValue +=
                humidityDifference *
                scaleCoefficient(
                    config.outsideInfluence,
                    elapsedMinutes
                );

            if (pump?.state === "ON") {
                sensor.currentValue += randomVariation(
                    config.pumpEffect.min,
                    config.pumpEffect.max
                ) * elapsedMinutes;
            }

            if (fan?.state === "ON") {
                sensor.currentValue -= randomVariation(
                    config.fanEffect.min,
                    config.fanEffect.max
                ) * elapsedMinutes;
            }

            if (growLight?.state === "ON") {
                sensor.currentValue -= randomVariation(
                    config.growLightEffect.min,
                    config.growLightEffect.max
                ) * elapsedMinutes;
            }

            sensor.currentValue += scaledRandomVariation(
                config.randomVariation.min,
                config.randomVariation.max,
                elapsedMinutes
            );

            return clamp(
                sensor.currentValue,
                config.min,
                config.max
            );
        }

        case "SOIL_MOISTURE": {
            const pump = getActuatorByType("WATER_PUMP");
            const growLight = getActuatorByType("GROW_LIGHT");
            const config = simulationConfig.sensors.soilMoisture;

            if (pump?.state === "ON") {
                sensor.currentValue += randomVariation(
                    config.pumpEffect.min,
                    config.pumpEffect.max
                ) * elapsedMinutes;
            } else {
                sensor.currentValue += randomVariation(
                    config.naturalDrying.min,
                    config.naturalDrying.max
                ) * elapsedMinutes;
            }

            if (growLight?.state === "ON") {
                sensor.currentValue -=
                    config.growLightEffect * elapsedMinutes;
            }

            return clamp(
                sensor.currentValue,
                config.min,
                config.max
            );
        }

        case "LIGHT": {
            const growLight = getActuatorByType("GROW_LIGHT");
            const config = simulationConfig.sensors.light;

            const naturalLight = getNaturalLight(
                weather,
                simulationTime
            );

            let targetLight = naturalLight;

            if (growLight?.state === "ON") {
                targetLight += config.growLightEffect;
            }

            const lightDifference =
                targetLight - sensor.currentValue;

            sensor.currentValue +=
                lightDifference *
                scaleCoefficient(
                    config.responseRate,
                    elapsedMinutes
                );

            sensor.currentValue += scaledRandomVariation(
                config.randomVariation.min,
                config.randomVariation.max,
                elapsedMinutes
            );

            return clamp(
                sensor.currentValue,
                config.min,
                config.max
            );
        }

        default:
            return sensor.currentValue;
    }
}

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

async function sendReading(
    sensor,
    value,
    simulationTime
) {
    const deviceId = deviceState.deviceId;
    const unit = unitBySensorType[sensor.type];

    if (!deviceId) {
        throw new Error("Device state has not been initialized");
    }

    if (!unit) {
        throw new Error(
            `No measurement unit configured for ${sensor.type}`
        );
    }

    const response = await fetch(
        `${BACKEND_URL}/api/device/readings`,
        {
            method: "POST",
            headers: DEVICE_HEADERS,
            body: JSON.stringify({
                deviceId,
                readings: [
                    {
                        sensorId: sensor.id,
                        value,
                        unit,
                        timestamp: simulationTime.toISOString()
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

    return response.json();
}

function applyAutomaticRules(
    photoperiodStatus,
    simulationTime
) {
    const pump = getActuatorByType("WATER_PUMP");
    const fan = getActuatorByType("VENTILATION_FAN");
    const growLight = getActuatorByType("GROW_LIGHT");

    const temperatureSensor = getSensorByType("TEMPERATURE");
    const humiditySensor = getSensorByType("HUMIDITY");
    const soilSensor = getSensorByType("SOIL_MOISTURE");
    const lightSensor = getSensorByType("LIGHT");

    const rules = simulationConfig.automaticRules;

    if (
        pump &&
        pump.controlMode === "AUTO" &&
        soilSensor
    ) {
        if (
            soilSensor.currentValue < rules.pump.turnOnBelow &&
            pump.state === "OFF"
        ) {
            pump.state = "ON";

            console.log(
                `Pump: OFF -> ON (soil moisture: ${soilSensor.currentValue.toFixed(2)}%)`
            );
        } else if (
            soilSensor.currentValue >= rules.pump.turnOffAtOrAbove &&
            pump.state === "ON"
        ) {
            pump.state = "OFF";

            console.log(
                `Pump: ON -> OFF (soil moisture: ${soilSensor.currentValue.toFixed(2)}%)`
            );
        }
    }

    if (
        fan &&
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

        if (shouldTurnOn && fan.state === "OFF") {
            fan.state = "ON";

            console.log(
                `Fan: OFF -> ON (temperature: ${temperatureSensor.currentValue.toFixed(2)}°C, humidity: ${humiditySensor.currentValue.toFixed(2)}%)`
            );
        } else if (shouldTurnOff && fan.state === "ON") {
            fan.state = "OFF";

            console.log(
                `Fan: ON -> OFF (temperature: ${temperatureSensor.currentValue.toFixed(2)}°C, humidity: ${humiditySensor.currentValue.toFixed(2)}%)`
            );
        }
    }

    if (
        growLight &&
        growLight.controlMode === "AUTO"
    ) {
        if (!photoperiodStatus) {
            if (growLight.state === "ON") {
                growLight.state = "OFF";

                console.error(
                    "Grow light: ON -> OFF (photoperiod status unavailable)"
                );
            }
        } else if (photoperiodStatus.limitReached) {
            if (growLight.state === "ON") {
                growLight.state = "OFF";

                console.log(
                    "Grow light: ON -> OFF (daily photoperiod limit reached)"
                );
            }
        } else if (lightSensor) {
            const hour = Number(
                new Intl.DateTimeFormat("en-GB", {
                    timeZone: simulationConfig.location.timezone,
                    hour: "2-digit",
                    hourCycle: "h23"
                }).format(simulationTime)
            );

            const withinOperatingWindow =
                hour >= rules.growLight.operatingWindow.startHour &&
                hour < rules.growLight.operatingWindow.endHour;

            if (!withinOperatingWindow) {
                if (growLight.state === "ON") {
                    growLight.state = "OFF";

                    console.log(
                        "Grow light: ON -> OFF (outside operating window)"
                    );
                }
            } else if (
                lightSensor.currentValue < rules.growLight.turnOnBelow &&
                growLight.state === "OFF"
            ) {
                growLight.state = "ON";

                console.log(
                    `Grow light: OFF -> ON (light: ${lightSensor.currentValue.toFixed(2)} lux)`
                );
            } else if (
                lightSensor.currentValue >=
                rules.growLight.turnOffAtOrAbove &&
                growLight.state === "ON"
            ) {
                growLight.state = "OFF";

                console.log(
                    `Grow light: ON -> OFF (light: ${lightSensor.currentValue.toFixed(2)} lux)`
                );
            }
        }
    }
}
