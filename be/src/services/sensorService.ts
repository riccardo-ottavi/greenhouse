import { sensors } from "../data/sensors";

export function getAllSensors(){
    return(
        sensors
    )
}

export function getSensorById(id: number){
    return sensors.find((sensor) => {
        return sensor.id === id
    })  
}