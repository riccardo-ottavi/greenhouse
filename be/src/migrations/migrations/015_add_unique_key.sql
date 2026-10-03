ALTER TABLE actuators
ADD UNIQUE KEY uq_actuators_id_device (id, device_id);