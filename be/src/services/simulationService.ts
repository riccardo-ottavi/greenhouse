import { readings } from "../data/readings";
import { ReadingUnit } from "../types/Reading";
import { Sensor } from "../types/Sensor";

export function simulateSensor(sensor: Sensor){
    createReading(sensor, generateNextValue(sensor));
}

function randomVariation(min: number, max: number) {
    return Math.random() * (max - min) + min;
}

export function generateNextValue(sensor: Sensor) {
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

let nextReadingId = 7

export function createReading(sensor: Sensor, newValue: number) {

    let valueUnit: ReadingUnit;

    switch (sensor.type) {
        case "TEMPERATURE":
            valueUnit = "°C";
            break;

        case "HUMIDITY":
            valueUnit = "%";
            break;

        case "SOIL_MOISTURE":
            valueUnit = "%";
            break;

        case "LIGHT":
            valueUnit = "lux";
            break;
    }

    readings.push({
        id: nextReadingId,
        sensorId: sensor.id,
        value: newValue,
        unit: valueUnit,
        timestamp: new Date
    });

    nextReadingId += 1;
}