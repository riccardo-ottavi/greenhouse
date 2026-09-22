const express = require("express");

const sensorController = require('../controllers/sensorController');
const readingController = require("../controllers/readingController");

const router = express.Router();

router.get('/', sensorController.index)

router.get('/:id', sensorController.show)

router.get("/:sensorId/readings", readingController.index);

module.exports = router;