"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const environmentalAlertController_js_1 = require("../controllers/environmentalAlertController.js");
const router = (0, express_1.Router)();
router.get("/", environmentalAlertController_js_1.index);
exports.default = router;
