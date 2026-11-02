"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllSensors = getAllSensors;
exports.getSensorById = getSensorById;
exports.getSensorsByDeviceId = getSensorsByDeviceId;
const connection_js_1 = require("../database/connection.js");
async function getAllSensors() {
    const [rows] = await connection_js_1.db.query(`
      SELECT
        id,
        device_id AS deviceId,
        name,
        type,
        status,
        sampling_interval AS samplingInterval,
        current_value AS currentValue,
        last_update AS lastUpdate,
        zone_id AS zoneId
      FROM sensors
    `);
    return rows;
}
async function getSensorById(id) {
    const [rows] = await connection_js_1.db.query(`
      SELECT
        id,
        device_id AS deviceId,
        name,
        type,
        status,
        sampling_interval AS samplingInterval,
        current_value AS currentValue,
        last_update AS lastUpdate,
        zone_id AS zoneId
      FROM sensors
      WHERE id = ?
    `, [id]);
    const sensors = rows;
    return sensors[0];
}
async function getSensorsByDeviceId(deviceId) {
    const [rows] = await connection_js_1.db.query(`
      SELECT
        id,
        device_id AS deviceId,
        name,
        type,
        status,
        sampling_interval AS samplingInterval,
        current_value AS currentValue,
        last_update AS lastUpdate,
        zone_id AS zoneId
      FROM sensors
      WHERE device_id = ?
      ORDER BY id ASC
    `, [deviceId]);
    return rows;
}
