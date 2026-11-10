import { Router } from "express";

import {
  index,
  show
} from "../controllers/sensorController.js";

import {
  getBySensorId,
  getAggregateBySensorId
} from "../controllers/readingController.js";

const router = Router();

router.get("/", index);

router.get("/:sensorId/readings", getBySensorId);

router.get("/:sensorId/readings/aggregate", getAggregateBySensorId);

router.get("/:id", show);

export default router;