import { readings } from "../data/readings";
import { Sensor } from "../types/Sensor";

function randomVariation(min: number, max: number) {
    return Math.random() * (max - min) + min;
}

export function generateNextValue(sensor: Sensor) {
    switch (sensor.type) {
        case "TEMPERATURE":
            sensor.currentValue += randomVariation(-0.5, 0.5);
            console.log(sensor);
            return sensor.currentValue;
        case "HUMIDITY":
            sensor.currentValue += randomVariation(-2, 2);
            console.log(sensor);
            return sensor.currentValue;
        case "SOIL_MOISTURE":
            sensor.currentValue += randomVariation(-0.5, 0.5);
            console.log(sensor);
            return sensor.currentValue;
        case "LIGHT":
            sensor.currentValue += randomVariation(-50, 50);
            console.log(sensor);
            return sensor.currentValue;
    }
}

export function createReading() {
    readings.push({
        id: 7,
        sensorId: 1,
        value: 30,
        unit: "°C",
        timestamp: new Date
    })
}