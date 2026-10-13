import { useEffect } from "react";
import { fetchDeviceList } from "../api/device";
import DeviceCard from "../components/DeviceCard";

export default function HomePage(){

    
    fetchDeviceList();
  

    return(
        <div className="homepage page">
            <h1>Devices List</h1>
            <DeviceCard />
        </div>
        
    )
}