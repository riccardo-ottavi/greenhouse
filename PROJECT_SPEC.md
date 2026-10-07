# Greenhouse Monitoring System

## 1. Simulated Sensors

The virtual device will simulate four types of sensors, chosen to represent the main environmental conditions of a greenhouse without introducing unnecessary complexity. The sensors will be air temperature, measured in °C and physically represented by the SHT31 sensor, relative air humidity, measured in % and also physically represented by the SHT31, soil moisture, measured in % and physically represented by an analog soil moisture sensor, and light intensity, measured in lux and physically represented by the BH1750 sensor.

Although temperature and air humidity can be measured by the same physical SHT31 component, they will be treated as two separate sensors within the software architecture, since they represent two distinct environmental variables and should be managed, stored, and displayed independently. This does not imply the use of two physical SHT31 components.

The simulator will not attempt to reproduce the electronic operation of the physical components in detail. Instead, it will reproduce their behaviour at the device level by generating plausible values, using the appropriate units of measurement and maintaining consistency with the overall state of the greenhouse environment.

Each reading sent by the device will include the sensor ID, measured value, unit of measurement, and timestamp. The unit will be explicitly included in the reading rather than being implicitly inferred by the backend. However, the backend will validate that the received unit is consistent with the type of sensor associated with the given sensor ID before storing the reading. This keeps the device communication self-descriptive while ensuring that the backend remains responsible for data validation.

No additional sensors, such as CO₂, atmospheric pressure, soil temperature, pH, or soil conductivity, will be simulated at this stage in order to keep the project focused on its core functionality.

---

## 2. Simulated Actuators

The virtual device will simulate three types of actuators that can influence the greenhouse environment: a water pump, a ventilation fan, and a grow light.

The water pump will be responsible for irrigation and will primarily affect soil moisture. The ventilation fan will be used to regulate the greenhouse environment by affecting both air temperature and relative air humidity. The grow light will primarily affect light intensity and may also have an indirect effect on air temperature.

Each actuator will have an operational state, initially represented as either ON or OFF, and its effects on the environmental variables will be simulated progressively rather than instantaneously. The specific relationships and rates of change between actuators and environmental variables will be defined separately when modelling the greenhouse environment.

Each actuator will also have a separate control mode, either AUTO or MANUAL. The control mode determines whether the actuator is controlled by the device's automatic rules or by explicit commands received from the backend.

The selected actuators are intentionally limited to these three components in order to provide meaningful interactions between the simulated device and the greenhouse without introducing unnecessary complexity. They also represent components that could realistically be replaced by physical actuators controlled by an ESP32 in a future hardware implementation.

---

## 3. Device and Actuator States

Sensors and actuators will use different state models according to their respective roles.

Sensors will support four possible states:

- ONLINE — the sensor is functioning and producing valid readings.
- OFFLINE — the sensor is not communicating with the device.
- WARNING — the sensor is communicating but an abnormal condition has been detected.
- ERROR — the sensor is not functioning correctly.

Actuators will use two separate concepts: an operational state and a control mode.

The operational state will initially support:

- ON — the actuator is currently active.
- OFF — the actuator is currently inactive.

The control mode will support:

- AUTO — the actuator is controlled by the automatic rules.
- MANUAL — the actuator is controlled by explicit user commands.

The control mode is intentionally separate from the operational state. This allows the system to represent four possible combinations:

- AUTO + ON
- AUTO + OFF
- MANUAL + ON
- MANUAL + OFF

The source of an actuator state change, such as an automatic rule or a manual user action, will therefore not be represented as an additional actuator state.

---

## 4. Environmental Behaviour

The virtual greenhouse will simulate the evolution of its environmental conditions over time rather than generating completely random sensor values. The model is intentionally simplified compared with a real greenhouse, but its relationships are based on environmental behaviours such as heat exchange, ventilation, irrigation, evaporation, and the daily variation of natural light.

The goal is to produce a coherent and plausible environment while keeping the simulation understandable and maintainable.

The simulator will operate using simulation cycles, with each cycle representing approximately one simulated minute. The simulator does not necessarily need to wait one real minute between cycles; the simulation time can progress faster than real time.

Each cycle will calculate the new environmental state based on the previous state, the external environment, the current actuator states, and a small amount of natural variability. Environmental values will therefore change progressively rather than instantaneously.

### Temperature

The greenhouse temperature will be represented as an internal environmental variable influenced primarily by the outside temperature, the ventilation fan, and the grow light.

The outside temperature will be obtained from a weather API when available, with a locally simulated fallback used if the external service is unavailable. The outside temperature will therefore act as an environmental input rather than directly representing the greenhouse temperature.

The internal temperature will gradually tend towards the outside temperature. This tendency will be relatively slow, representing the thermal inertia of the greenhouse. During the day, higher outside temperatures will generally cause the greenhouse temperature to increase, while cooler nighttime temperatures will generally cause it to decrease.

The ventilation fan will progressively reduce the internal temperature, while the grow light will produce a smaller progressive warming effect. These effects can occur simultaneously and will be combined when calculating the new temperature.

The initial greenhouse temperature will be 22 °C, with the simulation maintaining a plausible operating range of approximately 10–35 °C. The initial value is a starting point for the simulation rather than a fixed target temperature.

As a starting point for the simulation model, the approximate effect per simulation cycle will be:

- tendency towards outside temperature: ±0.10 °C
- ventilation fan ON: approximately −0.15 °C
- grow light ON: approximately +0.03 °C

These values are simulation parameters rather than universal physical measurements. They are intended to reproduce the relative behaviour of the different influences while keeping the model simple.

### Air Humidity

Air humidity will be influenced by the outside humidity, the water pump, the ventilation fan, and to a very small extent the grow light.

As with temperature, the outside humidity will act as an environmental input and the internal humidity will gradually tend towards it rather than changing instantaneously.

The water pump will have the strongest direct effect on air humidity. When irrigation is active, humidity will progressively increase. The ventilation fan will reduce humidity by exchanging the air inside the greenhouse with the external environment, but its direct effect on humidity will intentionally be weaker than the effect of the water pump.

The grow light may produce a very small decrease in humidity as an indirect consequence of increased evaporation, but this effect will remain minor.

The initial air humidity will be 65%, with a simulated range of approximately 20–95%.

As a starting point for the simulation model, the approximate effect per simulation cycle will be:

- tendency towards outside humidity: ±0.20%
- water pump ON: approximately +1.00%
- ventilation fan ON: approximately −0.30%
- grow light ON: approximately −0.05%

The model will not directly couple air humidity to greenhouse temperature at this stage. This keeps the relationship between variables understandable while still providing meaningful interactions between the sensors and actuators.

### Soil Moisture

Soil moisture will represent a normalized percentage value rather than a universal physical measurement of water content.

In a real greenhouse, soil moisture measurements depend on the soil or growing medium, sensor characteristics, calibration, and irrigation conditions. The simulator will therefore use the percentage as an internal scale that allows the behaviour of the virtual soil to be represented consistently.

Soil moisture will naturally decrease over time due to drying and evapotranspiration. The water pump will be the main mechanism responsible for increasing soil moisture.

When the pump is active, moisture will increase progressively rather than immediately reaching a target value. The grow light may slightly accelerate drying, representing the increased environmental demand associated with light exposure. The ventilation fan will not have a direct effect on soil moisture in the initial model.

The initial soil moisture will be 45%, with a simulated range of approximately 10–90%.

As a starting point for the simulation model, the approximate effect per simulation cycle will be:

- natural drying: approximately −0.05%
- additional drying with grow light ON: approximately −0.02%
- water pump ON: approximately +0.80%

Air humidity will not directly modify soil moisture at this stage. The model will instead represent the main relationship through irrigation and natural drying.

### Light Intensity

Light intensity will be modelled differently from the other environmental variables because natural light follows a daily cycle. The main input will therefore be the time of day, which will determine the approximate natural light level. The grow light will then add artificial light when it is active.

Natural light will progressively increase during the morning, reach its highest levels around the middle of the day, and progressively decrease during the afternoon and evening until reaching approximately zero during the night.

The exact curve will be a simplified representation rather than a physical model of solar radiation, since real greenhouse light levels also depend on season, weather, geographical position, orientation, and greenhouse covering.

The initial light intensity will be approximately 10,000 lux, while the simulated range will be approximately 0–60,000 lux.

The grow light will add approximately 5,000 lux when active, with its effect being applied progressively rather than instantaneously.

The simulator will therefore conceptually calculate light intensity as:

```text
Natural light based on time of day
+
Artificial light from the grow light
```

The simulator will use lux because the virtual device is intended to represent the behaviour of a BH1750-type light sensor. Although other measurements such as PAR or PPFD are more directly relevant to plant photosynthesis, lux is appropriate for the scope and hardware reference of this project.

### Environmental Variability and Limits

The simulation will not use completely random changes for environmental values. Instead, each variable will follow a deterministic model based on its environmental inputs and actuator states, with a small random variation added to individual changes.

This prevents the values from following perfectly predictable sequences while preserving the underlying environmental relationships.

For example, an actuator that normally produces an effect of approximately +1.00% per cycle may produce small variations around that value rather than exactly +1.00% every time.

All simulated environmental variables will be constrained to their defined plausible ranges. Values will therefore never be allowed to exceed the minimum or maximum limits of the simulation model.

The resulting model will provide four interconnected but intentionally understandable environmental behaviours:

- Temperature gradually follows the external environment and is affected by the fan and grow light.
- Air humidity gradually follows the external environment and is strongly affected by irrigation, with a smaller effect from ventilation.
- Soil moisture gradually decreases naturally and increases significantly when the water pump is active.
- Light intensity follows a daily natural-light cycle and increases when the grow light is active.

The numerical coefficients will remain configurable simulation parameters so that the behaviour can be adjusted later without changing the overall architecture.

---

## 5. Automatic Rules

The virtual device will support automatic control rules that use sensor readings to determine when actuators should be activated or deactivated.

The automatic control system will use threshold-based rules with hysteresis. This means that the threshold used to activate an actuator will be different from the threshold used to deactivate it. This prevents an actuator from repeatedly switching between ON and OFF when a sensor value fluctuates around a single threshold.

The thresholds defined below are simulation parameters, not universal agronomic recommendations. In a real greenhouse, appropriate thresholds would depend on the crop, growing medium, sensor characteristics, and other environmental factors.

### Water Pump

The water pump will primarily be controlled according to soil moisture.

The proposed rules are:

- If soil moisture falls below 30%, the water pump is switched ON.
- If soil moisture reaches or exceeds 50%, the water pump is switched OFF.

The pump will therefore remain active while the soil is being rehydrated instead of switching off immediately after the value moves above the activation threshold.

### Ventilation Fan

The ventilation fan will be controlled using both greenhouse temperature and air humidity.

The fan will be switched ON when either of the following conditions is met:

- greenhouse temperature is above 28 °C
- air humidity is above 75%

The fan will be switched OFF only when both of the following conditions are met:

- greenhouse temperature is below 25 °C
- air humidity is below 70%

This allows the fan to contribute both to temperature control and humidity management.

### Grow Light

The grow light will primarily be controlled according to light intensity and time of day.

Automatic lighting will only be allowed during a defined daytime operating window:

- 06:00–20:00

Within this window:

- if light intensity falls below 10,000 lux, the grow light is switched ON
- if light intensity reaches or exceeds 15,000 lux, the grow light is switched OFF

The difference between the ON and OFF thresholds provides hysteresis and prevents unnecessary switching when natural light fluctuates around the threshold.

The grow light will therefore act as supplemental lighting rather than replacing natural light.

### Automatic and Manual Control

Each actuator will have a separate control mode:

- AUTO — the actuator is controlled by the automatic rules.
- MANUAL — the actuator is controlled by explicit user commands.

The control mode is separate from the actuator's operational state.

An actuator can therefore be:

- AUTO + ON
- AUTO + OFF
- MANUAL + ON
- MANUAL + OFF

When an actuator is in AUTO mode, the automatic rules are responsible for changing its state. When it is in MANUAL mode, automatic rules will not override the user's command.

When an actuator changes from MANUAL to AUTO, the automatic rules will immediately re-evaluate the current environmental conditions. The device will not arbitrarily force the actuator into a predefined state. Instead, the appropriate automatic rule will determine the next state according to the current sensor values.

The automatic control system will therefore follow this conceptual flow:

```text
Sensor readings
      ↓
Automatic Rules
      ↓
Actuator State
```

Manual control will follow:

```text
User Command
      ↓
Backend
      ↓
Device
      ↓
Actuator State
```

The automatic rules will be implemented as configurable parameters so that thresholds and timing behaviour can be adjusted without changing the overall architecture.

---

## 6. Device Commands

The virtual device will be able to receive commands from the backend in order to change actuator states or change actuator control modes.

The backend will act as the communication gateway between the frontend and the device, meaning that the frontend will never communicate directly with the device.

This separation will allow the virtual device to be replaced by a physical device such as an ESP32 in the future without requiring major changes to the frontend architecture.

The device will initially support two types of persistent commands:

### Set Actuator State

The SET_ACTUATOR_STATE command will request a specific state for an actuator.

The command will identify both the actuator and the desired state.

Examples:

```text
WATER_PUMP → ON
WATER_PUMP → OFF
VENTILATION_FAN → ON
GROW_LIGHT → OFF
```

This command changes the operational state of the actuator but does not determine whether the actuator is controlled automatically or manually.

### Set Control Mode

The SET_CONTROL_MODE command will change the control mode of an actuator between:

- AUTO — the actuator is controlled by the automatic rules.
- MANUAL — the actuator is controlled by explicit user commands.

Examples:

```text
WATER_PUMP → MANUAL
WATER_PUMP → AUTO
```

When a user manually activates an actuator, the device will first enter MANUAL mode and then apply the requested actuator state.

Conceptually:

```text
SET_CONTROL_MODE(WATER_PUMP, MANUAL)
        ↓
SET_ACTUATOR_STATE(WATER_PUMP, ON)
```

The actuator will remain under manual control until its control mode is changed back to AUTO.

When an actuator changes from MANUAL to AUTO, the automatic rules will immediately re-evaluate the current environmental conditions.

### Device Status Requests

A request for the current device status is not considered a persistent Command.

Device status can instead be obtained through the backend's normal API or through a dedicated device-status communication operation when necessary.

This distinction keeps the persistent commands data focused on instructions that actually modify actuator state or control mode.

### Command Results and Device Status

Commands and device status will be treated as separate concepts.

A Command represents an instruction sent by the backend.

A Command Result indicates whether the device successfully received and executed that instruction.

The current Device status represents the actual state of the device after commands and automatic rules have been applied.

A successful command result should therefore provide enough information for the backend to determine that the requested operation was executed successfully. If the device cannot execute a command, it should instead return a failed result.

The device may also provide an informational reason associated with the current actuator state, for example:

```text
WATER_PUMP → ON, AUTO, SOIL_MOISTURE_LOW
WATER_PUMP → ON, MANUAL, USER_COMMAND
VENTILATION_FAN → ON, AUTO, TEMPERATURE_HIGH
```

The reason is informational and does not represent an additional actuator state or a persistent actuator mode.

The overall manual command flow will therefore follow:

```text
Frontend
    ↓
Backend
    ↓
Validated Command
    ↓
Device
    ↓
Actuator
```

Automatic actuator changes do not create persistent Commands. They are produced directly by the Device's automatic control logic.

---

## 7. Communication Between Device and Backend

Communication between the virtual device and the backend will be implemented exclusively through HTTP, using REST APIs.

The backend will act as the central communication point between the device and the rest of the application:

```text
Frontend → Backend
Device   → Backend
Backend  → Device
```

The frontend will never communicate directly with the device.

This approach keeps the architecture simple and makes it possible to use the same communication contract both with the software simulator and, in the future, with a physical device such as an ESP32.

### Device Identity

The device will be identified by a unique device ID, initially represented by an identifier such as:

```text
GREENHOUSE_001
```

Sensors and actuators will be associated with this device.

This approach allows the architecture to support multiple devices in the future without requiring changes to the main communication model.

### Device → Backend

The Device → Backend communication will mainly include three operations.

#### Sensor Readings

The device will transmit sensor readings through a POST request to a dedicated endpoint such as:

```http
POST /api/device/readings
```

The device will be able to send multiple readings within the same request.

Conceptually:

```json
{
  "deviceId": "GREENHOUSE_001",
  "readings": [
    {
      "sensorId": 1,
      "value": 23.5,
      "unit": "°C",
      "timestamp": "..."
    },
    {
      "sensorId": 2,
      "value": 65,
      "unit": "%",
      "timestamp": "..."
    }
  ]
}
```

The backend will validate the received data and subsequently store the readings in the database.

#### Command Results

The device will transmit command execution results through an endpoint such as:

```http
POST /api/device/command-results
```

Each result will be associated with a specific command ID, allowing the backend to determine which command was executed and whether the operation succeeded or failed.

#### Heartbeat

The device will periodically send a heartbeat through an endpoint such as:

```http
POST /api/device/heartbeat
```

The heartbeat will allow the backend to determine whether the device is communicating correctly.

The backend will maintain the most recent valid communication time as lastSeen. Individual heartbeat events will not initially be stored as historical records.

### Backend → Device

The Backend → Device communication will mainly be used to manage commands sent to actuators.

The backend will maintain a queue of pending commands, and the device will use HTTP polling to periodically check whether new commands are available.

An endpoint such as:

```http
GET /api/device/commands?deviceId=GREENHOUSE_001
```

can be used for this purpose.

If there are no pending commands, the backend will return an empty response. Otherwise, it will return one or more commands to be executed.

Each command will have a unique identifier and will contain the information required to execute the operation, such as the command type, the affected actuator, and the requested state or control mode.

### Command Lifecycle

Commands will use the following simple lifecycle:

```text
PENDING
   ↓
EXECUTED
```

or:

```text
PENDING
   ↓
FAILED
```

When a command is created by the backend, it will initially have the PENDING status.

After the device receives and successfully executes it, the command will transition to EXECUTED.

If an error occurs, it will instead transition to FAILED.

If the device is temporarily unreachable, the command will remain PENDING and can be retrieved when the device becomes available again.

### Command Idempotency

Each command will be identified by a unique command ID, which will also be included in the result returned by the device.

The device must prevent the same command from being executed twice if a response is lost during communication.

For example, if the device successfully executes command 123 but the corresponding result does not reach the backend, the backend may return the same command during the next polling request.

The device must therefore recognize that command 123 has already been executed and return a successful result again without unnecessarily repeating the actuator operation.

### Authentication

The device will use a simple authentication mechanism based on an API key or equivalent token.

In a real environment exposed to the Internet, HTTP communication will be protected through HTTPS.

The goal of this first version is not to implement an advanced device provisioning system, but to define a mechanism simple enough to be used by both the simulator and a future physical device.

### Device Communication Cycle

The simulator's operational cycle can conceptually consist of:

1. Update environmental state
2. Apply automatic rules
3. Generate sensor readings
4. Send readings to backend
5. Poll for pending commands
6. Execute received commands
7. Send command results
8. Send heartbeat

The exact frequency of these operations can be modified later without changing the main HTTP communication contract.

### Overall Architecture

The overall architecture will therefore be:

```text
                ┌─────────────────────┐
                 │      FRONTEND       │
                 │   React + TypeScript│
                 └──────────┬──────────┘
                            │
                           HTTP
                            │
                 ┌──────────▼──────────┐
                 │       BACKEND       │
                 │ Node.js + Express   │
                 │      + MySQL        │
                 └──────────┬──────────┘
                            │
                           HTTP
                            │
                 ┌──────────▼──────────┐
                 │       DEVICE        │
                 │  Node.js Simulator  │
                 │        today        │
                 └─────────────────────┘
```

The Device can later be replaced by:

```text
                ┌─────────────────────┐
                 │       DEVICE        │
                 │   ESP32 + firmware  │
                 └─────────────────────┘
```

The backend should not depend on whether the Device is implemented as a simulator or physical hardware. Both implementations must follow the same external HTTP communication contract.

---

## 8. Persistence

The system will persist in the database the information required to maintain the identity and configuration of the greenhouse components, their current operational state, historical sensor measurements, and the commands exchanged between the backend and the Device.

The database will therefore act as the persistent source of information for the application, while the Device implementation will remain responsible for runtime simulation or physical interaction with sensors and actuators.

### Information That Will Be Persisted

The following information will be persisted:

```text
PERSISTED

├── Device identity and configuration
│   ├── unique device identifier
│   ├── human-readable name
│   ├── operational status
│   ├── authentication information
│   ├── registration time
│   └── last communication time
│
├── Sensor configuration and current state
│   ├── sensor identity
│   ├── associated device
│   ├── name
│   ├── sensor type
│   ├── operational status
│   ├── sampling interval
│   ├── current value
│   ├── last update time
│   └── zone association
│
├── Historical sensor readings
│   ├── sensor
│   ├── measured value
│   ├── unit
│   └── timestamp
│
├── Actuator configuration and current state
│   ├── actuator identity
│   ├── associated device
│   ├── name
│   ├── actuator type
│   ├── operational state
│   ├── control mode
│   └── last update time
│
└── Commands
    ├── command identity
    ├── associated device
    ├── associated actuator
    ├── command type
    ├── requested state or control mode
    ├── execution status
    ├── creation time
    └── completion time
```

The Device identity and configuration will be persisted so that the backend can identify the Device, determine its current availability, and maintain its relationships with sensors and actuators.

The Sensor configuration and current state will be persisted so that the backend and frontend can access the latest sensor information directly.

The current sensor value will be stored separately from historical measurements. This means that the dashboard can access the latest value directly without having to retrieve the most recent record from the entire readings history.

The system will also persist historical sensor readings generated by the Device. Each Reading represents a measurement produced by a sensor at a specific point in time.

Historical readings are required for displaying charts, reviewing past conditions, and potentially analysing environmental trends.

The Actuator configuration and current state will be persisted so that the backend and frontend can determine which actuators exist, their current state, and whether they are operating under automatic or manual control.

The database represents the current persistent state of an actuator. The concrete Device implementation remains responsible for physically or virtually applying that state.

The system will persist Commands sent by the backend to the Device. Commands will be stored so that the backend can maintain a queue of pending instructions, associate each instruction with a specific Device and actuator, and record whether the command was successfully executed or failed.

The completedAt timestamp will represent the time at which a command finished its execution lifecycle, whether the final status is EXECUTED or FAILED.

### Information That Will Not Initially Be Persisted

The following information will not initially be stored as independent database records:

```text
NOT PERSISTED INITIALLY

├── Individual heartbeat history
├── Automatic control rules
├── Hardware-specific information
└── Simulator-specific parameters
```

The system will not initially persist every individual heartbeat received from the Device. Instead, the backend will maintain the latest communication time through lastSeen.

A complete heartbeat history is not necessary for the initial scope of the project and would introduce additional data without providing an immediate functional benefit.

The automatic control rules will not initially be stored as independent database entities.

The rules defined for the greenhouse, such as activating the water pump when soil moisture falls below a threshold or activating the ventilation fan when temperature or humidity becomes too high, will remain part of the Device's runtime control logic.

Automatic actuator changes therefore do not generate persistent Commands in the commands table. The resulting actuator state will instead be persisted as the current state of the Actuator.

The database will also not contain hardware-specific implementation details, such as GPIO pins, I²C addresses, ADC configuration, electrical characteristics, or internal simulation parameters used by the Node.js simulator.

These details belong to the concrete Device implementation and must not become dependencies of the backend domain model.

### Persistence Principles

The persistence model follows four main principles:

- Current state is persisted when the application needs fast access to the latest operational information.
- Historical measurements are persisted when the application needs to reconstruct environmental conditions over time.
- Commands are persisted because they represent asynchronous instructions that must survive temporary communication failures.
- Implementation-specific runtime details are not persisted because they belong to the concrete Device implementation rather than the backend domain model.

The database will therefore remain focused on persistent application state and historical data, while runtime behaviour, automatic control logic, and implementation-specific details remain outside the database.

### Database Entities Derived from the Persistence Model

The persistence requirements will be represented through five main domain entities:

- Device
- Sensor
- Reading
- Actuator
- Command

Their conceptual relationships are:

```text
Device 1 ───── N Sensor
Sensor 1 ───── N Reading

Device 1 ───── N Actuator
Actuator 1 ─── N Command
```

The Device represents the identifiable physical or virtual control unit.

The Sensor represents a logical sensor associated with a Device and responsible for measuring one environmental variable.

The Reading represents one historical measurement produced by a Sensor.

The Actuator represents a controllable component associated with a Device and maintains its current state and control mode.

The Command represents an instruction issued by the backend to modify an Actuator's state or control mode.

These entities will form the basis of the database implementation. Their exact fields, data types, constraints, foreign keys, indexes, and other database-specific details will be defined during the database implementation phase.

## Backend Verification & Testing

The backend and device simulator were tested together through end-to-end functional tests to verify the main behaviors defined in the project specification.

### 1. Device Heartbeat

**Goal:** verify device presence tracking and automatic offline detection.

**Test:**

* Start the simulator.
* Verify that the device is marked as `ONLINE`.
* Stop the simulator.
* Wait until the configured offline threshold is exceeded.
* Verify that the device becomes `OFFLINE`.
* Restart the simulator.
* Verify that the device returns to `ONLINE`.

**Result:** PASS

The backend correctly updates `last_seen` and changes the device operational status according to the heartbeat activity.

---

### 2. Sensor Readings

**Goal:** verify that the simulator can send readings and that the backend correctly validates and persists them.

**Tested sensors:**

* Temperature
* Relative humidity
* Soil moisture
* Light intensity

**Verified behavior:**

* Readings are sent through the device API.
* Each reading contains `sensorId`, `value`, `unit` and `timestamp`.
* The backend validates the sensor/device relationship.
* Units are validated against the sensor type.
* Current sensor values are updated.
* Historical readings are persisted separately.

**Result:** PASS

The four simulated sensors continuously produce valid readings and the backend correctly maintains both current state and historical data.

---

### 3. Actuator Commands

**Goal:** verify the complete command lifecycle between backend and simulated device.

**Tested behavior:**

* Create a `SET_ACTUATOR_STATE` command.
* Verify the command starts with `PENDING` status.
* Device polls pending commands.
* Simulator executes the command.
* Device sends the command result back to the backend.
* Backend changes the command status to `EXECUTED`.
* Actuator state is persisted.

**Additional test:**
A command created while the simulator was offline remained `PENDING` and was executed after the simulator restarted.

**Result:** PASS

Command persistence and delayed execution work correctly.

---

### 4. Automatic Fan Control

**Goal:** verify the fan hysteresis rules.

**Tested rules:**

* Fan turns `ON` when temperature exceeds 28 °C or humidity exceeds 75%.
* Fan turns `OFF` only when temperature falls below 25 °C and humidity falls below 70%.

**Result:** PASS

The simulator correctly applies the hysteresis logic and the resulting actuator state is synchronized with the backend.

---

### 5. Automatic Grow Light Control

**Goal:** verify the grow light thresholds and operating window.

**Tested behavior:**

* Light remains `OFF` above the upper threshold.
* Light turns `ON` below the lower threshold.
* Light turns `OFF` when the operating window is exceeded.
* Automatic control respects the configured 06:00–20:00 operating window.

**Result:** PASS

The grow light correctly follows the configured automatic rules.

---

### 6. Automatic Water Pump Control

**Goal:** verify soil moisture hysteresis.

**Tested rules:**

* Pump turns `ON` below 30% soil moisture.
* Pump turns `OFF` at or above 50%.

**Result:** PASS

The pump correctly follows the automatic control thresholds.

---

### 7. Device Status Synchronization

**Goal:** verify that actuator state changes performed automatically by the simulator are persisted by the backend.

**Tested behavior:**

* Automatic rule changes an actuator state.
* Simulator sends the current device status to the backend.
* Backend persists the new actuator state and control mode.

**Result:** PASS

Automatic actuator changes are correctly synchronized without creating persistent command records.

---

### 8. Device Authentication

**Goal:** verify that device endpoints are protected by API-key authentication.

**Tested behavior:**

* Requests with the correct API key are accepted.
* Requests without an API key are rejected with HTTP `401 Unauthorized`.
* Requests with an invalid API key are rejected with HTTP `401 Unauthorized`.

The simulator stores its API key in an environment variable loaded through `dotenv`. The backend stores only the SHA-256 hash of the device API key.

**Result:** PASS

The device API requires valid authentication for communication between the simulator and backend.

---

### 9. Command Idempotency

**Goal:** verify that the same command cannot be executed more than once.

**Tested behavior:**

* A command is executed by the simulator.
* The backend records the command as `EXECUTED`.
* Repeated command-result processing does not execute the same command again.

**Result:** PASS

The command lifecycle is protected against duplicate execution.

---

### 10. Transactional Reading Persistence

**Goal:** verify that a batch of readings is persisted atomically.

**Tested behavior:**

* A batch containing valid readings is accepted and persisted.
* Invalid data causes the transaction to fail.
* Partial persistence is prevented.

**Result:** PASS

Reading persistence uses a transaction so that a batch is either fully accepted or rejected.

---

### 11. Remaining Test

The main remaining functional test is the **failed command path**.

This test will verify that when the simulated device cannot successfully execute a valid persistent command, the backend correctly records the command as `FAILED` and stores the completion information.

---

### Test Summary

| Area                                   | Status  |
| -------------------------------------- | ------- |
| Device heartbeat and offline detection | PASS    |
| Sensor readings                        | PASS    |
| Current sensor state                   | PASS    |
| Historical readings                    | PASS    |
| Actuator commands                      | PASS    |
| Offline command persistence            | PASS    |
| Fan automatic control                  | PASS    |
| Grow light automatic control           | PASS    |
| Water pump automatic control           | PASS    |
| Device status synchronization          | PASS    |
| Command idempotency                    | PASS    |
| Reading transaction atomicity          | PASS    |
| Device API authentication              | PASS    |
| Failed command handling                | Pending |

The backend has therefore been verified not only at the individual endpoint level, but also through the complete communication flow between the simulated device and the backend.
