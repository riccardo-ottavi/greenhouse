
import { NavLink, useParams } from "react-router-dom";

export default function Sidebar() {
    const { id } = useParams<{ id: string }>();

    const devicePath = id ? `/devices/${id}` : null;

    return (
        <aside className="sidebar-container">
            <nav aria-label="Main navigation">
                <ul>
                    <li>
                        <NavLink
                            to="/"
                            end
                            className={({ isActive }) =>
                                isActive ? "sidebar-link active" : "sidebar-link"
                            }
                        >
                            Devices
                        </NavLink>
                    </li>

                    {devicePath && (
                        <>
                            <li>
                                <NavLink
                                    to={devicePath}
                                    end
                                    className={({ isActive }) =>
                                        isActive ? "sidebar-link active" : "sidebar-link"
                                    }
                                >
                                    Dashboard
                                </NavLink>
                            </li>

                            <li>
                                <NavLink
                                    to={`${devicePath}/sensors`}
                                    className={({ isActive }) =>
                                        isActive ? "sidebar-link active" : "sidebar-link"
                                    }
                                >
                                    Sensors
                                </NavLink>
                            </li>

                            <li>
                                <NavLink
                                    to={`${devicePath}/actuators`}
                                    className={({ isActive }) =>
                                        isActive ? "sidebar-link active" : "sidebar-link"
                                    }
                                >
                                    Actuators
                                </NavLink>
                            </li>

                            <li>
                                <NavLink
                                    to={`${devicePath}/trends`}
                                    className={({ isActive }) =>
                                        isActive ? "sidebar-link active" : "sidebar-link"
                                    }
                                >
                                    Trends
                                </NavLink>
                            </li>

                            <li>
                                <NavLink
                                    to={`${devicePath}/alerts`}
                                    className={({ isActive }) =>
                                        isActive ? "sidebar-link active" : "sidebar-link"
                                    }
                                >
                                    Alerts
                                </NavLink>
                            </li>
                        </>
                    )}
                </ul>
            </nav>
        </aside>
    );
}
