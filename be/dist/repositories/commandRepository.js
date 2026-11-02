"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPendingCommands = getPendingCommands;
exports.completeCommand = completeCommand;
exports.getActuatorForCommand = getActuatorForCommand;
exports.insertCommand = insertCommand;
const connection_js_1 = require("../database/connection.js");
const AppError_js_1 = require("../errors/AppError.js");
async function getPendingCommands(deviceId) {
    const [rows] = await connection_js_1.db.query(`
      SELECT
        commands.id,
        commands.device_id AS deviceId,
        commands.actuator_id AS actuatorId,
        commands.type,
        commands.state,
        commands.control_mode AS controlMode,
        commands.status,
        commands.created_at AS createdAt,
        commands.completed_at AS completedAt
      FROM commands
      INNER JOIN devices
        ON commands.device_id = devices.id
      WHERE devices.device_id = ?
        AND commands.status = 'PENDING'
      ORDER BY commands.created_at ASC
    `, [deviceId]);
    return rows;
}
async function completeCommand(commandId, deviceId, success) {
    const connection = await connection_js_1.db.getConnection();
    try {
        await connection.beginTransaction();
        const [rows] = await connection.query(`
        SELECT
          commands.id,
          commands.actuator_id AS actuatorId,
          commands.type,
          commands.state,
          commands.control_mode AS controlMode,
          commands.status
        FROM commands
        INNER JOIN devices
          ON commands.device_id = devices.id
        WHERE commands.id = ?
          AND devices.device_id = ?
        FOR UPDATE
      `, [commandId, deviceId]);
        const commands = rows;
        const command = commands[0];
        if (!command) {
            throw new AppError_js_1.AppError("Command not found or does not belong to device", 404);
        }
        if (command.status !== "PENDING") {
            await connection.rollback();
            return;
        }
        if (!success) {
            await connection.query(`
          UPDATE commands
          SET
            status = 'FAILED',
            completed_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `, [commandId]);
            await connection.commit();
            return;
        }
        const [actuatorRows] = await connection.query(`
        SELECT id
        FROM actuators
        WHERE id = ?
          AND device_id = (
            SELECT id
            FROM devices
            WHERE device_id = ?
          )
        FOR UPDATE
      `, [command.actuatorId, deviceId]);
        const actuators = actuatorRows;
        if (actuators.length === 0) {
            throw new AppError_js_1.AppError("Actuator not found for the specified device", 404);
        }
        if (command.type === "SET_ACTUATOR_STATE") {
            if (command.state === null) {
                throw new AppError_js_1.AppError("Missing state for SET_ACTUATOR_STATE", 400);
            }
            await connection.query(`
          UPDATE actuators
          SET
            state = ?,
            last_update = CURRENT_TIMESTAMP
          WHERE id = ?
            AND device_id = (
              SELECT id
              FROM devices
              WHERE device_id = ?
            )
        `, [command.state, command.actuatorId, deviceId]);
        }
        else if (command.type === "SET_CONTROL_MODE") {
            if (command.controlMode === null) {
                throw new AppError_js_1.AppError("Missing control mode for SET_CONTROL_MODE", 400);
            }
            await connection.query(`
          UPDATE actuators
          SET
            control_mode = ?,
            last_update = CURRENT_TIMESTAMP
          WHERE id = ?
            AND device_id = (
              SELECT id
              FROM devices
              WHERE device_id = ?
            )
        `, [command.controlMode, command.actuatorId, deviceId]);
        }
        else {
            throw new AppError_js_1.AppError("Unsupported command type", 400);
        }
        await connection.query(`
        UPDATE commands
        SET
          status = 'EXECUTED',
          completed_at = CURRENT_TIMESTAMP
        WHERE id = ?
          AND status = 'PENDING'
      `, [commandId]);
        await connection.commit();
    }
    catch (error) {
        await connection.rollback();
        throw error;
    }
    finally {
        connection.release();
    }
}
async function getActuatorForCommand(actuatorId) {
    const [rows] = await connection_js_1.db.query(`
      SELECT
        id,
        device_id AS deviceId
      FROM actuators
      WHERE id = ?
    `, [actuatorId]);
    const actuators = rows;
    return actuators[0];
}
async function insertCommand(actuatorId, deviceId, type, state, controlMode) {
    const [result] = await connection_js_1.db.query(`
      INSERT INTO commands (
        device_id,
        actuator_id,
        type,
        state,
        control_mode,
        status
      )
      VALUES (?, ?, ?, ?, ?, 'PENDING')
    `, [
        deviceId,
        actuatorId,
        type,
        state,
        controlMode
    ]);
    const insertResult = result;
    return {
        id: insertResult.insertId,
        deviceId,
        actuatorId,
        type,
        state,
        controlMode,
        status: "PENDING",
        createdAt: new Date(),
        completedAt: null
    };
}
