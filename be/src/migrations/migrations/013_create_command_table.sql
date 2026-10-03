CREATE TABLE commands (
    id INT NOT NULL AUTO_INCREMENT,
    device_id INT NOT NULL,
    actuator_id INT NOT NULL,
    type ENUM(
        'SET_ACTUATOR_STATE',
        'SET_CONTROL_MODE'
    ) NOT NULL,
    state ENUM('ON', 'OFF') NULL,
    control_mode ENUM('AUTO', 'MANUAL') NULL,
    status ENUM(
        'PENDING',
        'EXECUTED',
        'FAILED'
    ) NOT NULL DEFAULT 'PENDING',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME NULL,
    PRIMARY KEY (id),
    KEY idx_commands_device_id (device_id),
    KEY idx_commands_actuator_id (actuator_id),
    CONSTRAINT fk_commands_device
        FOREIGN KEY (device_id)
        REFERENCES devices(id),
    CONSTRAINT fk_commands_actuator
        FOREIGN KEY (actuator_id)
        REFERENCES actuators(id)
) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_0900_ai_ci;