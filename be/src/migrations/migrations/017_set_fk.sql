ALTER TABLE commands
ADD CONSTRAINT fk_commands_actuator_device
FOREIGN KEY (actuator_id, device_id)
REFERENCES actuators (id, device_id);