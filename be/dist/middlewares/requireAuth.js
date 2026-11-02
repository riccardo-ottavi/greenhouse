"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = requireAuth;
const authService_js_1 = require("../services/authService.js");
async function requireAuth(req, res, next) {
    const userId = req.session.userId;
    if (!userId) {
        res.status(401).json({
            message: "Authentication required"
        });
        return;
    }
    try {
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
                res.status(401).json({
                    message: "Authentication required"
                });
            });
            return;
        }
        res.locals.authenticatedUser = user;
        next();
    }
    catch (error) {
        next(error);
    }
}
