const express = require("express");

const sensorController = require('../controllers/sensorController');

const router = express.Router();

router.get('/', sensorController.index)

router.get('/:id', sensorController.show)

module.exports = router;