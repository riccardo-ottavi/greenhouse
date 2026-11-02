"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllReadings = getAllReadings;
exports.getReadingById = getReadingById;
exports.getSensorById = getSensorById;
exports.getReadingsBySensorId = getReadingsBySensorId;
exports.sensorBelongsToDevice = sensorBelongsToDevice;
exports.getDeviceByDeviceId = getDeviceByDeviceId;
exports.insertReading = insertReading;
exports.updateSensorCurrentValue = updateSensorCurrentValue;
exports.insertReadingWithConnection = insertReadingWithConnection;
exports.updateSensorCurrentValueWithConnection = updateSensorCurrentValueWithConnection;
const connection_js_1 = require("../database/connection.js");
async function getAllReadings() {
    const [rows] = await connection_js_1.db.query(`
      SELECT
        id,
        sensor_id AS sensorId,
        value,
        unit,
        timestamp
      FROM readings
    `);
    return rows;
}
async function getReadingById(id) {
    const [rows] = await connection_js_1.db.query(`
      SELECT
        id,
        sensor_id AS sensorId,
        value,
        unit,
        timestamp
      FROM readings
      WHERE id = ?
    `, [id]);
    const readings = rows;
    return readings[0];
}
async function getSensorById(sensorId) {
    const [rows] = await connection_js_1.db.query(`
      SELECT
        id,
        type
      FROM sensors
      WHERE id = ?
    `, [sensorId]);
    const sensors = rows;
    return sensors[0];
}
async function getReadingsBySensorId(sensorId) {
    const [rows] = await connection_js_1.db.query(`
      SELECT
        id,
        sensor_id AS sensorId,
        value,
        unit,
        timestamp
      FROM readings
      WHERE sensor_id = ?
      ORDER BY timestamp DESC
    `, [sensorId]);
    return rows;
}
async function sensorBelongsToDevice(deviceId, sensorId) {
    const [rows] = await connection_js_1.db.query(`
      SELECT
        sensors.id
      FROM sensors
      INNER JOIN devices
        ON sensors.device_id = devices.id
      WHERE devices.device_id = ?
        AND sensors.id = ?
    `, [
        deviceId,
        sensorId
    ]);
    const sensors = rows;
    return sensors.length > 0;
}
async function getDeviceByDeviceId(deviceId) {
    const [rows] = await connection_js_1.db.query(`
      SELECT
        id
      FROM devices
      WHERE device_id = ?
    `, [deviceId]);
    const devices = rows;
    return devices[0];
}
async function insertReading(sensorId, value, unit, timestamp) {
    const [result] = await connection_js_1.db.query(`
      INSERT INTO readings
        (sensor_id, value, unit, timestamp)
      VALUES
        (?, ?, ?, ?)
    `, [
        sensorId,
        value,
        unit,
        timestamp
    ]);
    const insertResult = result;
    return insertResult.insertId;
}
async function updateSensorCurrentValue(sensorId, value, timestamp) {
    await connection_js_1.db.query(`
      UPDATE sensors
      SET
        current_value = ?,
        last_update = ?
      WHERE id = ?
    `, [
        value,
        timestamp,
        sensorId
    ]);
}
async function insertReadingWithConnection(connection, sensorId, value, unit, timestamp) {
    const [result] = await connection.query(`
      INSERT INTO readings
        (sensor_id, value, unit, timestamp)
      VALUES
        (?, ?, ?, ?)
    `, [
        sensorId,
        value,
        unit,
        timestamp
    ]);
    const insertResult = result;
    return insertResult.insertId;
}
async function updateSensorCurrentValueWithConnection(connection, sensorId, value, timestamp) {
    await connection.query(`
      UPDATE sensors
      SET
        current_value = ?,
        last_update = ?
      WHERE id = ?
    `, [
        value,
        timestamp,
        sensorId
    ]);
}
