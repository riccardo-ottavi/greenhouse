"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const readingController_js_1 = require("../controllers/readingController.js");
const router = (0, express_1.Router)();
router.get("/", readingController_js_1.index);
router.get("/:id", readingController_js_1.show);
exports.default = router;
