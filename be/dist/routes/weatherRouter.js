"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const weatherController_js_1 = require("../controllers/weatherController.js");
const router = (0, express_1.Router)();
router.get("/", weatherController_js_1.getExternalWeather);
exports.default = router;
