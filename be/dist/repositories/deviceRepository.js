"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllDevices = getAllDevices;
exports.getDeviceById = getDeviceById;
exports.getDeviceActuatorStates = getDeviceActuatorStates;
exports.getDeviceSensorConfigs = getDeviceSensorConfigs;
exports.updateHeartbeat = updateHeartbeat;
exports.markOfflineDevices = markOfflineDevices;
exports.getDeviceApiKeyHash = getDeviceApiKeyHash;
const connection_js_1 = require("../database/connection.js");
async function getAllDevices() {
    const [rows] = await connection_js_1.db.query(`
      SELECT
        id,
        device_id AS deviceId,
        name,
        status,
        last_seen AS lastSeen,
        created_at AS createdAt
      FROM devices
    `);
    return rows;
}
async function getDeviceById(id) {
    const [rows] = await connection_js_1.db.query(`
      SELECT
        id,
        device_id AS deviceId,
        name,
        status,
        last_seen AS lastSeen,
        created_at AS createdAt
      FROM devices
      WHERE id = ?
    `, [id]);
    const devices = rows;
    return devices[0];
}
async function getDeviceActuatorStates(deviceId) {
    const [rows] = await connection_js_1.db.query(`
      SELECT
        actuators.id AS actuatorId,
        actuators.name,
        actuators.type,
        actuators.state,
        actuators.control_mode AS controlMode
      FROM actuators
      INNER JOIN devices
        ON actuators.device_id = devices.id
      WHERE devices.device_id = ?
      ORDER BY actuators.id ASC
    `, [deviceId]);
    return rows;
}
async function getDeviceSensorConfigs(deviceId) {
    const [rows] = await connection_js_1.db.query(`
      SELECT
        sensors.id AS sensorId,
        sensors.name,
        sensors.type,
        sensors.sampling_interval AS samplingInterval
      FROM sensors
      INNER JOIN devices
        ON sensors.device_id = devices.id
      WHERE devices.device_id = ?
      ORDER BY sensors.id ASC
    `, [deviceId]);
    return rows;
}
async function updateHeartbeat(deviceId) {
    const [result] = await connection_js_1.db.query(`
      UPDATE devices
      SET
        status = 'ONLINE',
        last_seen = CURRENT_TIMESTAMP
      WHERE device_id = ?
    `, [deviceId]);
    return result.affectedRows > 0;
}
async function markOfflineDevices(thresholdSeconds) {
    await connection_js_1.db.query(`
      UPDATE devices
      SET status = 'OFFLINE'
      WHERE status = 'ONLINE'
        AND (
          last_seen IS NULL
          OR last_seen < CURRENT_TIMESTAMP - INTERVAL ? SECOND
        )
    `, [thresholdSeconds]);
}
async function getDeviceApiKeyHash(deviceId) {
    const [rows] = await connection_js_1.db.query(`
      SELECT
        api_key_hash AS apiKeyHash
      FROM devices
      WHERE device_id = ?
    `, [deviceId]);
    const devices = rows;
    return devices[0]?.apiKeyHash;
}
