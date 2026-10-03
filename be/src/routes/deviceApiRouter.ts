import { Router } from "express";
import { heartbeat } from "../controllers/deviceController.js";
import { createFromDevice } from "../controllers/readingController.js";

const router = Router();

router.post("/heartbeat", heartbeat);
router.post("/readings", createFromDevice);

export default router;