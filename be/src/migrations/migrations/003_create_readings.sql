CREATE TABLE readings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    sensor_id INT NOT NULL,
    value DOUBLE NOT NULL,
    unit VARCHAR(10) NOT NULL,
    timestamp DATETIME NOT NULL,

    FOREIGN KEY (sensor_id) REFERENCES sensors(id)
);