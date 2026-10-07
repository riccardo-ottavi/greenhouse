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
* An API key belonging to a different device is also rejected.

The simulator stores its API key in an environment variable loaded through `dotenv`. The backend stores only the SHA-256 hash of the device API key.

**Result:** PASS

The device API requires valid authentication for communication between the simulator and backend.

### 9. Restart-Safe Command Idempotency

**Goal:** verify that the same command cannot be executed more than once, including after a device restart.

**Tested behavior:**

* Create a valid persistent command.
* Verify that the command starts with `PENDING` status.
* Simulator executes the command and stores its command ID in the persistent command journal.
* Simulate a failure before the command result is sent to the backend.
* Verify that the backend still considers the command `PENDING`.
* Restart the simulator.
* Verify that the simulator receives the same pending command again.
* Verify that the persistent command journal detects the command as already processed.
* Verify that the actuator command is not executed a second time.
* Simulator sends the previously stored successful result to the backend.
* Backend changes the command status to `EXECUTED`.

**Result:** PASS

The simulator uses a persistent command journal to maintain command processing state across restarts. A command that was successfully executed before a device restart is therefore not executed again when the backend redelivers it.

### 10. Transactional Reading Persistence

**Goal:** verify that a batch of readings is persisted atomically.

**Tested behavior:**

* A batch containing valid readings is accepted and persisted.
* Invalid data causes the transaction to fail.
* Partial persistence is prevented.

**Result:** PASS

Reading persistence uses a transaction so that a batch is either fully accepted or rejected.

---

### 11. Failed Command Handling

**Goal:** verify that the backend correctly handles a persistent command reported as unsuccessful by the simulated device.

**Tested behavior:**

* Create a valid persistent command.
* Verify that the command starts with `PENDING` status.
* Simulate a device response with `success: false`.
* Backend changes the command status to `FAILED`.
* Backend stores the command completion timestamp.
* The actuator state is not modified by the failed command.

**Result:** PASS

The backend correctly handles failed command execution and records the failure without applying the requested actuator state.

---

### Test Summary

| Area                                   | Status |
| -------------------------------------- | ------ |
| Device heartbeat and offline detection | PASS   |
| Sensor readings                        | PASS   |
| Current sensor state                   | PASS   |
| Historical readings                    | PASS   |
| Actuator commands                      | PASS   |
| Offline command persistence            | PASS   |
| Fan automatic control                  | PASS   |
| Grow light automatic control           | PASS   |
| Water pump automatic control           | PASS   |
| Device status synchronization          | PASS   |
| Restart-safe command idempotency       | PASS   |
| Reading transaction atomicity          | PASS   |
| Device API authentication              | PASS   |
| Failed command handling                | PASS   |

The backend has therefore been verified not only at the individual endpoint level, but also through the complete communication flow between the simulated device and the backend. The main backend and simulator behaviors defined in the project specification have been successfully validated through end-to-end functional testing.
