import { Router } from "express";
import { heartbeat, index, show, getDeviceSensors } from "../controllers/deviceController";

const router = Router();

router.get("/", index);
router.get("/:id/sensors", getDeviceSensors);
router.get("/:id", show);

export default router;