const sensors = [
    {
        id: 1,
        type: "TEMPERATURE",
        currentValue: 23.5,
        unit: "°C"
    },
    {
        id: 2,
        type: "HUMIDITY",
        currentValue: 65,
        unit: "%"
    },
    {
        id: 3,
        type: "SOIL_MOISTURE",
        currentValue: 40,
        unit: "%"
    },
    {
        id: 4,
        type: "LIGHT",
        currentValue: 750,
        unit: "lux"
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
            return sensor.currentValue;
        case "HUMIDITY":
            sensor.currentValue += randomVariation(-2, 2);
            return sensor.currentValue;
        case "SOIL_MOISTURE":
            sensor.currentValue += randomVariation(-0.5, 0.5);
            return sensor.currentValue;
        case "LIGHT":
            sensor.currentValue += randomVariation(-50, 50);
            return sensor.currentValue;
    }
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
            //Todo: non dovresti mandare l'unità probabilmente ma dovresti dedurla nel backend im base al tipo
            unit: sensor.unit, 
            timestamp: new Date().toISOString()
        })
    });

    if (!response.ok) {
        throw new Error(`Failed to send reading: ${response.status}`);
    }

    return await response.json();
}

//todo: metti l'interval che la ripete
runSimulation();