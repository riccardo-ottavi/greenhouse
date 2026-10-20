
CREATE TABLE environmental_alerts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    sensor_id INT NOT NULL,
    type ENUM(
        'HIGH_TEMPERATURE',
        'HIGH_HUMIDITY',
        'LOW_SOIL_MOISTURE',
        'LOW_LIGHT'
    ) NOT NULL,
    status ENUM(
        'ACTIVE',
        'RESOLVED'
    ) NOT NULL DEFAULT 'ACTIVE',
    triggered_value DOUBLE NOT NULL,
    triggered_at DATETIME NOT NULL,
    resolved_at DATETIME NULL,

    CONSTRAINT fk_environmental_alerts_sensor
        FOREIGN KEY (sensor_id)
        REFERENCES sensors(id),

    INDEX idx_environmental_alerts_sensor_type_status
        (sensor_id, type, status),

    INDEX idx_environmental_alerts_status_triggered_at
        (status, triggered_at)
);
