CREATE DATABASE IF NOT EXISTS greenhouse_db;

USE greenhouse_db;

CREATE TABLE sensors (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL,
    type ENUM(
        'TEMPERATURE',
        'HUMIDITY',
        'SOIL_MOISTURE',
        'LIGHT'
    ) NOT NULL,
    status ENUM(
        'ONLINE',
        'OFFLINE',
        'WARNING',
        'ERROR'
    ) NOT NULL DEFAULT 'ONLINE',
    sampling_interval INT NOT NULL,
    current_value DOUBLE NOT NULL,
    last_update DATETIME NOT NULL,
    zone_id INT NOT NULL
);