import ExternalWeatherOverview from "./ExternalWeatherOverview";

import historyChart from "../assets/icons/history-chart.svg";
import arrowRight from "../assets/icons/arrow-right.svg";
import leafLogo from "../assets/icons/leaf-logo.svg";


export default function Hero() {
    return (
        <section>
            <div className="hero-container">
                <div className="hero-text">
                    <span className="align-row"><img src={leafLogo} alt={leafLogo} />Your greenhouse, always under control</span>
                    <h1>Welcome to your Greenhouse Monitoring System</h1>
                    <span>Minitor your weather, check your actuators e keep your greenhouse at the ideal rate</span>
                    <button>
                        <img src={historyChart} alt={historyChart} />
                        <div>View History</div>
                        <img src={arrowRight} alt={arrowRight} />
                    </button>
                </div>    
                <ExternalWeatherOverview />
            </div>
            
        </section>
    )
}