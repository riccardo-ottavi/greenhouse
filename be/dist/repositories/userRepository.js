"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserByUsername = getUserByUsername;
exports.getUserById = getUserById;
const connection_js_1 = require("../database/connection.js");
async function getUserByUsername(username) {
    const [rows] = await connection_js_1.db.query(`
      SELECT
        id,
        username,
        password_hash AS passwordHash,
        is_active AS isActive,
        created_at AS createdAt,
        updated_at AS updatedAt
      FROM users
      WHERE username = ?
      LIMIT 1
    `, [username]);
    const users = rows;
    if (!users[0]) {
        return undefined;
    }
    return {
        ...users[0],
        isActive: Boolean(users[0].isActive)
    };
}
async function getUserById(id) {
    const [rows] = await connection_js_1.db.query(`
      SELECT
        id,
        username,
        password_hash AS passwordHash,
        is_active AS isActive,
        created_at AS createdAt,
        updated_at AS updatedAt
      FROM users
      WHERE id = ?
      LIMIT 1
    `, [id]);
    const users = rows;
    if (!users[0]) {
        return undefined;
    }
    return {
        ...users[0],
        isActive: Boolean(users[0].isActive)
    };
}
