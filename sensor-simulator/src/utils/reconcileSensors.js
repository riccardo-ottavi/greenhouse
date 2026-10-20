
const sensorConfigKeyByType = {
    TEMPERATURE: "temperature",
    HUMIDITY: "humidity",
    SOIL_MOISTURE: "soilMoisture",
    LIGHT: "light"
};

export function reconcileSensors(
    currentSensors,
    configuredSensors,
    simulationConfig
) {
    const nextSensors = [];

    for (const [sensorId, sensorConfig] of Object.entries(
        configuredSensors
    )) {
        const id = Number(sensorId);

        const configKey = sensorConfigKeyByType[sensorConfig.type];
        const config = simulationConfig.sensors[configKey];

        if (!config) {
            console.warn(
                `Unsupported sensor type: ${sensorConfig.type}`
            );
            continue;
        }

        const existingSensor = currentSensors.find(
            (sensor) =>
                sensor.id === id &&
                sensor.type === sensorConfig.type
        );

        if (existingSensor) {
            nextSensors.push({
                ...existingSensor,
                name: sensorConfig.name
            });
        } else {
            nextSensors.push({
                id,
                name: sensorConfig.name,
                type: sensorConfig.type,
                currentValue: config.initialValue
            });
        }
    }

    return nextSensors;
}
