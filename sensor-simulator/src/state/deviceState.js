
const deviceState = {
  deviceId: null,
  sensors: {},
  actuators: {}
};

export function initializeDeviceState(config) {
  deviceState.deviceId = config.deviceId;

  deviceState.sensors = Object.fromEntries(
    config.sensors.map((sensor) => [
      sensor.sensorId,
      {
        name: sensor.name,
        type: sensor.type,
        samplingInterval: sensor.samplingInterval
      }
    ])
  );

  deviceState.actuators = Object.fromEntries(
    config.actuators.map((actuator) => [
      actuator.actuatorId,
      {
        name: actuator.name,
        type: actuator.type,
        state: actuator.state,
        controlMode: actuator.controlMode
      }
    ])
  );
}

export default deviceState;
