const express = require("express");

const readingController = require('../controllers/readingController');

const router = express.Router();

router.get('/', readingController.index)

router.get('/:id', readingController.show)

module.exports = router;