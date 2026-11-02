"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const sensorRouter_js_1 = __importDefault(require("./routes/sensorRouter.js"));
const readingRouter_js_1 = __importDefault(require("./routes/readingRouter.js"));
const deviceRouter_js_1 = __importDefault(require("./routes/deviceRouter.js"));
const deviceApiRouter_js_1 = __importDefault(require("./routes/deviceApiRouter.js"));
const actuatorRouter_js_1 = __importDefault(require("./routes/actuatorRouter.js"));
const weatherRouter_js_1 = __importDefault(require("./routes/weatherRouter.js"));
const environmentalAlertRouter_js_1 = __importDefault(require("./routes/environmentalAlertRouter.js"));
const authRouter_js_1 = __importDefault(require("./routes/authRouter.js"));
const session_js_1 = require("./config/session.js");
const errorHandler_js_1 = require("./middlewares/errorHandler.js");
const app = (0, express_1.default)();
const configuredFrontendUrl = process.env.FRONTEND_URL;
if (process.env.NODE_ENV === "production" &&
    !configuredFrontendUrl) {
    throw new Error("FRONTEND_URL must be configured in production.");
}
const frontendOrigins = (configuredFrontendUrl ?? "http://localhost:5173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
app.set("trust proxy", 1);
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        if (!origin || frontendOrigins.includes(origin)) {
            callback(null, true);
            return;
        }
        callback(new Error("Origin not allowed by CORS."));
    },
    credentials: true,
}));
app.use(express_1.default.json());
app.use(session_js_1.sessionMiddleware);
app.use("/api/sensors", sensorRouter_js_1.default);
app.use("/api/readings", readingRouter_js_1.default);
app.use("/api/devices", deviceRouter_js_1.default);
app.use("/api/device", deviceApiRouter_js_1.default);
app.use("/api/actuators", actuatorRouter_js_1.default);
app.use("/api/weather", weatherRouter_js_1.default);
app.use("/api/environmental-alerts", environmentalAlertRouter_js_1.default);
app.use("/api/auth", authRouter_js_1.default);
app.get("/", (_req, res) => {
    res.send("<h1>Greenhouse Monitoring System Homepage</h1>");
});
app.use(errorHandler_js_1.errorHandler);
exports.default = app;
