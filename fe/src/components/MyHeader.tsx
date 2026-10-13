import leafLogo from "../assets/icons/leaf-logo.svg";

export default function MyHeader(){
    return(
        <header>
            <div className="site-logo">
                <img src={leafLogo} alt={leafLogo} />
                <div className="site-logo-text">
                    <h3>Greenhouse</h3>
                    <span>Monitoring Sytem</span>
                </div>
            </div>
        </header>
    )
}