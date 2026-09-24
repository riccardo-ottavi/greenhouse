INSERT INTO sensors
    (name, type, status, sampling_interval, current_value, last_update, zone_id)
VALUES
    ('TEMP-001', 'TEMPERATURE', 'ONLINE', 5, 23.5, NOW(), 1),
    ('HUMI-001', 'HUMIDITY', 'ONLINE', 5, 65, NOW(), 1),
    ('SOILMOST-001', 'SOIL_MOISTURE', 'ONLINE', 5, 40, NOW(), 1),
    ('LIGHT-001', 'LIGHT', 'ONLINE', 5, 750, NOW(), 1);