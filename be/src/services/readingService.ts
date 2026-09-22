import { readings } from "../data/readings";

export function getAllReadings(){
    return(
        readings
    )
}

export function getReadingById(id: number){
    return readings.find((reading) => {
        return reading.id === id
    })  
}

export function getReadingsBySensorId(id: number){
    return readings.filter((reading)=>{
        return reading.sensorId === id
    })
}