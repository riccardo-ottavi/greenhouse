ALTER TABLE sensors
ADD CONSTRAINT fk_sensors_device
FOREIGN KEY (device_id)
REFERENCES devices(id);