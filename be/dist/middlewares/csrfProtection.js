"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.issueCsrfToken = issueCsrfToken;
exports.requireCsrfToken = requireCsrfToken;
const node_crypto_1 = require("node:crypto");
function issueCsrfToken(req, res, next) {
    if (!req.session.csrfToken) {
        req.session.csrfToken = (0, node_crypto_1.randomBytes)(32).toString("hex");
    }
    const csrfToken = req.session.csrfToken;
    req.session.save((error) => {
        if (error) {
            next(error);
            return;
        }
        res.json({ csrfToken });
    });
}
function requireCsrfToken(req, res, next) {
    const expected = req.session.csrfToken;
    const received = req.get("X-CSRF-Token");
    if (!expected || !received) {
        res.status(403).json({ message: "Invalid CSRF token" });
        return;
    }
    const expectedBuffer = Buffer.from(expected);
    const receivedBuffer = Buffer.from(received);
    if (expectedBuffer.length !== receivedBuffer.length ||
        !(0, node_crypto_1.timingSafeEqual)(expectedBuffer, receivedBuffer)) {
        res.status(403).json({ message: "Invalid CSRF token" });
        return;
    }
    next();
}
