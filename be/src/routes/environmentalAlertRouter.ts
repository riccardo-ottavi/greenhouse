import { Router } from "express";

import {
  index
} from "../controllers/environmentalAlertController.js";

const router = Router();

router.get("/", index);

export default router;