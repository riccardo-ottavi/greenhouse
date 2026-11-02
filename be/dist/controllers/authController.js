"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = login;
exports.me = me;
exports.logout = logout;
const node_crypto_1 = require("node:crypto");
const authService_js_1 = require("../services/authService.js");
async function login(req, res, next) {
    try {
        const { username, password } = req.body ?? {};
        if (typeof username !== "string" ||
            typeof password !== "string" ||
            !username.trim() ||
            !password ||
            username.length > 100) {
            res.status(400).json({ message: "Username and password are required" });
            return;
        }
        const user = await (0, authService_js_1.authenticateUser)(username.trim(), password);
        if (!user) {
            res.status(401).json({ message: "Invalid username or password" });
            return;
        }
        req.session.regenerate((regenerateError) => {
            if (regenerateError) {
                next(regenerateError);
                return;
            }
            req.session.userId = user.id;
            req.session.csrfToken = (0, node_crypto_1.randomBytes)(32).toString("hex");
            req.session.save((saveError) => {
                if (saveError) {
                    req.session.destroy((destroyError) => {
                        next(destroyError ?? saveError);
                    });
                    return;
                }
                res.status(200).json({
                    user,
                    csrfToken: req.session.csrfToken
                });
            });
        });
    }
    catch (error) {
        next(error);
    }
}
async function me(req, res, next) {
    try {
        const userId = req.session.userId;
        if (!userId) {
            res.status(401).json({ message: "Authentication required" });
            return;
        }
        const user = await (0, authService_js_1.getActiveUserById)(userId);
        if (!user) {
            req.session.destroy((error) => {
                if (error) {
                    next(error);
                    return;
                }
                res.clearCookie("greenhouse.sid", {
                    httpOnly: true,
                    sameSite: "lax",
                    secure: process.env.NODE_ENV === "production"
                });
                res.status(401).json({ message: "Authentication required" });
            });
            return;
        }
        res.json({ user });
    }
    catch (error) {
        next(error);
    }
}
function logout(req, res, next) {
    req.session.destroy((error) => {
        if (error) {
            next(error);
            return;
        }
        res.clearCookie("greenhouse.sid", {
            httpOnly: true,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production"
        });
        res.status(200).json({ message: "Logged out successfully" });
    });
}
