CREATE TABLE actuators (
    id INT NOT NULL AUTO_INCREMENT,
    device_id INT NOT NULL,
    name VARCHAR(50) NOT NULL,
    type ENUM(
        'WATER_PUMP',
        'VENTILATION_FAN',
        'GROW_LIGHT'
    ) NOT NULL,
    state ENUM('ON', 'OFF') NOT NULL DEFAULT 'OFF',
    control_mode ENUM('AUTO', 'MANUAL') NOT NULL DEFAULT 'AUTO',
    last_update DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_actuators_device_id (device_id),
    CONSTRAINT fk_actuators_device
        FOREIGN KEY (device_id)
        REFERENCES devices(id)
) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_0900_ai_ci;