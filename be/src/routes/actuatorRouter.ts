
import { Router } from "express";
import {
  index,
  show,
  command
} from "../controllers/actuatorController.js";
import { requireAuth } from "../middlewares/requireAuth.js";
import { requireCsrfToken } from "../middlewares/csrfProtection.js";

const router = Router();

router.get("/", index);
router.get("/:id", show);

router.post("/:id/command", requireAuth, requireCsrfToken, command);

export default router;
