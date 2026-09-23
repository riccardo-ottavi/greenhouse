import { readings } from "../data/readings";
import { Sensor } from "../types/Sensor";

function randomVariation(min: number, max: number){
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function generateNextValue(sensor: Sensor) {
    switch (sensor.type) {
        case "TEMPERATURE":
            sensor.currentValue += randomVariation(-0.5, 0.5);
            console.log(sensor);
            break
        case "HUMIDITY":
            sensor.currentValue += randomVariation(-2, 2);
            console.log(sensor);
            break
        case "SOIL_MOISTURE":
            sensor.currentValue += randomVariation(-0.5, 0.5);
            console.log(sensor);
            break
        case "LIGHT":
            sensor.currentValue += randomVariation(-50, 50);
            console.log("sensor");
            break
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