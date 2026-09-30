import { Router } from "express";

import {
  index,
  show
} from "../controllers/sensorController.js";

import {
  getBySensorId
} from "../controllers/readingController.js";

const router = Router();

router.get("/", index);

router.get("/:sensorId/readings", getBySensorId);

router.get("/:id", show);

export default router;