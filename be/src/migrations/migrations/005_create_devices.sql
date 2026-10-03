CREATE TABLE devices (
    id INT NOT NULL AUTO_INCREMENT,
    device_id VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    status ENUM('ONLINE', 'OFFLINE') NOT NULL DEFAULT 'OFFLINE',
    api_key_hash VARCHAR(255) NOT NULL,
    last_seen DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_devices_device_id (device_id)
) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_0900_ai_ci;