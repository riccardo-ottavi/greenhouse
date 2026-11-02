"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
const AppError_js_1 = require("../errors/AppError.js");
function errorHandler(error, _req, res, _next) {
    console.error("Error:", error);
    if (error instanceof AppError_js_1.AppError) {
        res.status(error.statusCode).json({
            message: error.message
        });
        return;
    }
    res.status(500).json({
        message: "Internal server error"
    });
}
