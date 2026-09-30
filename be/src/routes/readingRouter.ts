import { Router } from "express";

import {
  index,
  show,
  create
} from "../controllers/readingController.js";

import { validateReading } from "../middlewares/validateReading.js";

const router = Router();

router.get("/", index);

router.get("/:id", show);

router.post("/", validateReading, create);

export default router;