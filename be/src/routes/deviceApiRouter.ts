import { Router } from "express";
import { heartbeat } from "../controllers/deviceController.js";
import { createFromDevice } from "../controllers/readingController.js";
import { getPending, commandResult } from "../controllers/commandController.js";

const router = Router();

router.post("/heartbeat", heartbeat);
router.post("/readings", createFromDevice);
router.get("/commands", getPending);
router.post("/command-results", commandResult);

export default router;