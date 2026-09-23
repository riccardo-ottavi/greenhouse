import { Sensor } from "../types/Sensor";


export const sensors: Sensor[] = [{
    id: 1,
    name: "TEMP-001",
    type: "TEMPERATURE",
    status: "ONLINE",
    samplingInterval: 5,
    currentValue: 23.5,
    lastUpdate: new Date(),
    zoneId: 1
},
{
    id: 2,
    name: "HUMI-001",
    type: "HUMIDITY",
    status: "ONLINE",
    samplingInterval: 5,
    currentValue: 65,
    lastUpdate: new Date(),
    zoneId: 1
},
{
    id: 3,
    name: "SOIL-MOIST-001",
    type: "SOIL_MOISTURE",
    status: "ONLINE",
    samplingInterval: 5,
    currentValue: 40,
    lastUpdate: new Date(),
    zoneId: 1,
},
{
    id: 4,
    name: "LIGHT-001",
    type: "LIGHT",
    status: "ONLINE",
    samplingInterval: 5,
    currentValue: 20000,
    lastUpdate: new Date(),
    zoneId: 1,
},
]