"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sessionMiddleware = exports.sessionStore = void 0;
require("dotenv/config");
const express_session_1 = __importDefault(require("express-session"));
const express_mysql_session_1 = __importDefault(require("express-mysql-session"));
const connection_js_1 = require("../database/connection.js");
const sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret || sessionSecret.length < 32) {
    throw new Error("SESSION_SECRET is missing or too short. Configure a secret of at least 32 characters.");
}
const MySQLStore = (0, express_mysql_session_1.default)(express_session_1.default);
const isProduction = process.env.NODE_ENV === "production";
exports.sessionStore = new MySQLStore({
    createDatabaseTable: false,
    clearExpired: true,
    checkExpirationInterval: 15 * 60 * 1000,
    expiration: 24 * 60 * 60 * 1000,
}, connection_js_1.db);
exports.sessionMiddleware = (0, express_session_1.default)({
    name: "greenhouse.sid",
    secret: sessionSecret,
    store: exports.sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        sameSite: isProduction ? "none" : "lax",
        secure: isProduction,
        maxAge: 24 * 60 * 60 * 1000,
    },
});
