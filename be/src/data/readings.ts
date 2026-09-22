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
    sensorId: 1,
    value: 25,
    unit: "°C",
    timestamp: new Date()
},
{
    id:3,
    sensorId: 1,
    value: 25.5,
    unit: "°C",
    timestamp: new Date()
},
{
    id:4,
    sensorId: 2,
    value: 65,
    unit: "%",
    timestamp: new Date()
},
{
    id:5,
    sensorId: 2,
    value: 65,
    unit: "%",
    timestamp: new Date()
},
{
    id:6,
    sensorId: 3,
    value: 42,
    unit: "%",
    timestamp: new Date()
}
]