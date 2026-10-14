import { Router } from "express";
import {
  index,
  show,
  getDeviceSensors,
  
} from "../controllers/deviceController.js";
import { getDeviceActuators } from "../controllers/actuatorController.js";

const router = Router();

router.get("/", index);
router.get("/:id/sensors", getDeviceSensors);
router.get("/:id/actuators", getDeviceActuators);
router.get("/:id", show);

export default router;