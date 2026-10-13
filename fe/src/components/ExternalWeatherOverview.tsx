import thermometerIcon from "../assets/icons/thermometer.svg";
import humidityDrop from "../assets/icons/humidity-drop.svg";
import cloudSun from "../assets/icons/cloud-sun.svg";

export default function ExternalWeatherOverview(){
    return(
        <div className="external-weather-overview-container">
            <div className="conditions-row">
                <img src={cloudSun} alt="" />
                <h2>External Weather</h2>
            </div>
            
            <div className="br"></div>
            <div className="conditions-row">
                <img src={thermometerIcon} alt={thermometerIcon} />
                <div className="conditions-row-text">
                   <h3>22.3°C</h3> 
                   <span>Temperature</span>
                </div>
                
                
            </div>
            <div className="conditions-row">
                <img src={humidityDrop} alt={humidityDrop} />
                <div className="conditions-row-text">
                   <h3>61%</h3> 
                   <span>Humidity</span>
                </div>
            </div>
            <div className="br"></div>
            <span className="conditions-last-update">Last update: 13 oct 2026 - 15:09</span>
        </div>
    )
}