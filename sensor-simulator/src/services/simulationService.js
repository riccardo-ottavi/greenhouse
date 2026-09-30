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

function runSimulation() {

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
        case "TEMPERATURE":
            sensor.currentValue += randomVariation(-0.5, 0.5);
            return clamp(sensor.currentValue, 15, 40);

        case "HUMIDITY":
            sensor.currentValue += randomVariation(-2, 2);
            return clamp(sensor.currentValue, 20, 90);

        case "SOIL_MOISTURE":
            sensor.currentValue += randomVariation(-0.5, 0.5);
            return clamp(sensor.currentValue, 10, 80);

        case "LIGHT":
            sensor.currentValue += randomVariation(-50, 50);
            return clamp(sensor.currentValue, 0, 1200);
    }
}


function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

async function sendReading(sensor, value) {
    const response = await fetch("http://localhost:3000/readings", {
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
const SIMULATION_INTERVAL = 5000;

runSimulation();

setInterval(() => {
    runSimulation();
}, SIMULATION_INTERVAL);