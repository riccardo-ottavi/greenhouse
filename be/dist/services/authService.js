"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateUser = authenticateUser;
exports.getActiveUserById = getActiveUserById;
const argon2_1 = __importDefault(require("argon2"));
const userRepository_js_1 = require("../repositories/userRepository.js");
async function authenticateUser(username, password) {
    const user = await (0, userRepository_js_1.getUserByUsername)(username);
    if (!user || !user.isActive) {
        return null;
    }
    const passwordMatches = await argon2_1.default.verify(user.passwordHash, password);
    if (!passwordMatches) {
        return null;
    }
    return {
        id: user.id,
        username: user.username
    };
}
async function getActiveUserById(id) {
    const user = await (0, userRepository_js_1.getUserById)(id);
    if (!user || !user.isActive) {
        return null;
    }
    return {
        id: user.id,
        username: user.username
    };
}
