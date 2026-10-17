
import { ResultSetHeader, RowDataPacket } from "mysql2";

import { db } from "../database/connection.js";
import {
    EnvironmentalAlertRecord,
    EnvironmentalAlertStatus
} from "../types/EnvironmentalAlertRecord.js";
import { EnvironmentalAlertType } from "../types/EnvironmentalAlert.js";

interface EnvironmentalAlertRow extends RowDataPacket {
    id: number;
    sensor_id: number;
    type: EnvironmentalAlertType;
    status: EnvironmentalAlertStatus;
    triggered_value: number;
    triggered_at: Date;
    resolved_at: Date | null;
}

function toEnvironmentalAlertRecord(
    row: EnvironmentalAlertRow
): EnvironmentalAlertRecord {
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

export async function findActiveAlertBySensorAndType(
    sensorId: number,
    type: EnvironmentalAlertType
): Promise<EnvironmentalAlertRecord | undefined> {
    const [rows] = await db.execute<EnvironmentalAlertRow[]>(
        `SELECT *
         FROM environmental_alerts
         WHERE sensor_id = ?
           AND type = ?
           AND status = 'ACTIVE'
         LIMIT 1`,
        [sensorId, type]
    );

    if (rows.length === 0) {
        return undefined;
    }

    return toEnvironmentalAlertRecord(rows[0]);
}

export async function createEnvironmentalAlert(
    sensorId: number,
    type: EnvironmentalAlertType,
    triggeredValue: number,
    triggeredAt: Date
): Promise<number> {
    const [result] = await db.execute<ResultSetHeader>(
        `INSERT INTO environmental_alerts (
            sensor_id,
            type,
            status,
            triggered_value,
            triggered_at
        )
        VALUES (?, ?, 'ACTIVE', ?, ?)`,
        [sensorId, type, triggeredValue, triggeredAt]
    );

    return result.insertId;
}

export async function resolveEnvironmentalAlert(
    id: number,
    resolvedAt: Date
): Promise<void> {
    await db.execute(
        `UPDATE environmental_alerts
         SET status = 'RESOLVED',
             resolved_at = ?
         WHERE id = ?
           AND status = 'ACTIVE'`,
        [resolvedAt, id]
    );
}

export async function findActiveEnvironmentalAlerts():
    Promise<EnvironmentalAlertRecord[]> {
    const [rows] = await db.execute<EnvironmentalAlertRow[]>(
        `SELECT *
         FROM environmental_alerts
         WHERE status = 'ACTIVE'
         ORDER BY triggered_at DESC`
    );

    return rows.map(toEnvironmentalAlertRecord);
}
