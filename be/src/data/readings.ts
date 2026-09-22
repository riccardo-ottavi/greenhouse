import { Reading } from "../types/Reading";

export const readings: Reading[] = [{
    id:1,
    sensorId: 1,
    value: 24.5,
    unit: "°C",
    timestamp: new Date()
},
{
    id:2,
    sensorId: 2,
    value: 65,
    unit: "%",
    timestamp: new Date()
},
{
    id:3,
    sensorId: 3,
    value: 42,
    unit: "%",
    timestamp: new Date()
}
]