ALTER TABLE commands
ADD CONSTRAINT chk_commands_payload
CHECK (
    (
        type = 'SET_ACTUATOR_STATE'
        AND state IS NOT NULL
        AND control_mode IS NULL
    )
    OR
    (
        type = 'SET_CONTROL_MODE'
        AND state IS NULL
        AND control_mode IS NOT NULL
    )
);