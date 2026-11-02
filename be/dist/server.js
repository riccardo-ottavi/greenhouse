"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_js_1 = __importDefault(require("./app.js"));
const deviceService_js_1 = require("./services/deviceService.js");
const PORT = Number(process.env.PORT) || 3000;
app_js_1.default.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    setInterval(async () => {
        try {
            await (0, deviceService_js_1.markOfflineDevices)();
        }
        catch (error) {
            console.error("Device availability check error:", error);
        }
    }, 10000);
});
