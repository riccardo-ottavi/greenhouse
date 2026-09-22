import { readings } from "../data/readings";

export function getAllReadings(){
    return(
        readings
    )
}

export function getReadingById(id: number){
    return readings.find((sensor) => {
        return sensor.id === id
    })  
}