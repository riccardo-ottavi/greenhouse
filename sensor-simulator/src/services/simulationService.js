import { getActuatorState } from "./deviceService.js";

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
        currentValue: 40,
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
    });
}

function randomVariation(min, max) {
    return Math.random() * (max - min) + min;
}

function generateNextValue(sensor) {
    switch (sensor.type) {
        case "TEMPERATURE": {
            const fan = getActuatorState(2);

            sensor.currentValue += randomVariation(-0.5, 0.5);

            if (fan.state === "ON") {
                sensor.currentValue -= randomVariation(0.12, 0.18);
            }

            return clamp(sensor.currentValue, 10, 35);
        }

        case "HUMIDITY": {
            const fan = getActuatorState(2);

            sensor.currentValue += randomVariation(-2, 2);

            if (fan.state === "ON") {
                sensor.currentValue -= randomVariation(0.25, 0.35);
            }

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

            sensor.currentValue += randomVariation(-50, 50);

            if (growLight.state === "ON") {
                sensor.currentValue += randomVariation(4500, 5500);
            }

            return clamp(sensor.currentValue, 0, 60000);
        }
    }
}


function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

async function sendReading(sensor, value) {
    const response = await fetch("http://localhost:3000/api/readings", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            sensorId: sensor.id,
            value: value,
            timestamp: new Date().toISOString()
        })
    });

    if (!response.ok) {
        throw new Error(`Failed to send reading: ${response.status}`);
    }

    return await response.json();
}
