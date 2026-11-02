"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllActuators = getAllActuators;
exports.getActuatorById = getActuatorById;
exports.updateActuatorStatus = updateActuatorStatus;
exports.getActuatorsByDeviceId = getActuatorsByDeviceId;
const connection_js_1 = require("../database/connection.js");
async function getAllActuators() {
    const [rows] = await connection_js_1.db.query(`
      SELECT
        id,
        device_id AS deviceId,
        name,
        type,
        state,
        control_mode AS controlMode,
        last_update AS lastUpdate
      FROM actuators
    `);
    return rows;
}
async function getActuatorById(id) {
    const [rows] = await connection_js_1.db.query(`
      SELECT
        id,
        device_id AS deviceId,
        name,
        type,
        state,
        control_mode AS controlMode,
        last_update AS lastUpdate
      FROM actuators
      WHERE id = ?
    `, [id]);
    const actuators = rows;
    return actuators[0];
}
async function updateActuatorStatus(deviceId, actuatorId, state, controlMode) {
    const [result] = await connection_js_1.db.query(`
      UPDATE actuators
      SET
        state = ?,
        control_mode = ?,
        last_update = NOW()
      WHERE id = ?
        AND device_id = (
          SELECT id
          FROM devices
          WHERE device_id = ?
        )
    `, [
        state,
        controlMode,
        actuatorId,
        deviceId
    ]);
    const updateResult = result;
    return updateResult.affectedRows > 0;
}
async function getActuatorsByDeviceId(deviceId) {
    const [rows] = await connection_js_1.db.query(`
      SELECT
        id,
        device_id AS deviceId,
        name,
        type,
        state,
        control_mode AS controlMode,
        last_update AS lastUpdate
      FROM actuators
      WHERE device_id = ?
      ORDER BY id ASC
    `, [deviceId]);
    return rows;
}
