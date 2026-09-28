const express = require("express");

import { validateReading } from "../middlewares/validateReading.js";

const readingController = require('../controllers/readingController');

const router = express.Router();

router.get('/', readingController.index);

router.get('/:id', readingController.show);

router.post("/", validateReading ,readingController.create);

module.exports = router;