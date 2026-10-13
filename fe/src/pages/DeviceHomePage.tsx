import Hero from "../components/Hero";
import menuSensor from "../assets/icons/menu-sensor.svg";
import SensorOverviewCard from "../components/SensorOverviewCard";

export default function DeviceHomePage() {

    return (
        <>
            <div className="device-homepage-container page">
                <Hero />
                <div className="sensors-overview">
                    <div className="sensors-overview-header">
                        <img src={menuSensor} alt="" />
                        <div className="sensors-overview-text">
                            <h3>Sensors</h3>
                            <span>Sensors state and values</span>
                        </div>
                        
                    </div>
                    <div className="sensors-overview-row">
                        <SensorOverviewCard />
                        <SensorOverviewCard />
                        <SensorOverviewCard />
                        <SensorOverviewCard />
                    </div>
                    <div className="trend-history">
                        
                    </div>
                </div>
            </div>
        </>

    )
}