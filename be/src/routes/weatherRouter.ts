
import { Router } from "express";
import { getExternalWeather } from "../controllers/weatherController.js";

const router = Router();

router.get("/", getExternalWeather);

export default router;
