"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findActiveAlertBySensorAndType = findActiveAlertBySensorAndType;
exports.createEnvironmentalAlert = createEnvironmentalAlert;
exports.resolveEnvironmentalAlert = resolveEnvironmentalAlert;
exports.findActiveEnvironmentalAlerts = findActiveEnvironmentalAlerts;
const connection_js_1 = require("../database/connection.js");
function toEnvironmentalAlertRecord(row) {
    return {
        id: row.id,
        sensorId: row.sensor_id,
        type: row.type,
        status: row.status,
        triggeredValue: Number(row.triggered_value),
        triggeredAt: new Date(row.triggered_at),
        resolvedAt: row.resolved_at
            ? new Date(row.resolved_at)
            : null
    };
}
async function findActiveAlertBySensorAndType(sensorId, type) {
    const [rows] = await connection_js_1.db.execute(`SELECT *
         FROM environmental_alerts
         WHERE sensor_id = ?
           AND type = ?
           AND status = 'ACTIVE'
         LIMIT 1`, [sensorId, type]);
    if (rows.length === 0) {
        return undefined;
    }
    return toEnvironmentalAlertRecord(rows[0]);
}
async function createEnvironmentalAlert(sensorId, type, triggeredValue, triggeredAt) {
    const [result] = await connection_js_1.db.execute(`INSERT INTO environmental_alerts (
            sensor_id,
            type,
            status,
            triggered_value,
            triggered_at
        )
        VALUES (?, ?, 'ACTIVE', ?, ?)`, [sensorId, type, triggeredValue, triggeredAt]);
    return result.insertId;
}
async function resolveEnvironmentalAlert(id, resolvedAt) {
    await connection_js_1.db.execute(`UPDATE environmental_alerts
         SET status = 'RESOLVED',
             resolved_at = ?
         WHERE id = ?
           AND status = 'ACTIVE'`, [resolvedAt, id]);
}
async function findActiveEnvironmentalAlerts() {
    const [rows] = await connection_js_1.db.execute(`SELECT *
         FROM environmental_alerts
         WHERE status = 'ACTIVE'
         ORDER BY triggered_at DESC`);
    return rows.map(toEnvironmentalAlertRecord);
}
