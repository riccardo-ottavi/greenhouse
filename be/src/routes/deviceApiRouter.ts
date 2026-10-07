import { Router } from "express";

import { getConfig, heartbeat, updateStatus } from "../controllers/deviceController.js";

import { createFromDevice } from "../controllers/readingController.js";

import { getPending, commandResult } from "../controllers/commandController.js";

import { deviceAuth } from "../middlewares/deviceAuth.js"; 

const router = Router();

router.use(deviceAuth);

router.post("/heartbeat", heartbeat);

router.post("/readings", createFromDevice);

router.get("/commands", getPending);

router.post("/command-results", commandResult);

router.post("/status", updateStatus);

router.get("/config", getConfig);

export default router;