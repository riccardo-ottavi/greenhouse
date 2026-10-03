import { Router } from "express";
import {
    command,
  index,
  show
} from "../controllers/actuatorController.js";

const router = Router();

router.get("/", index);
router.get("/:id", show);
router.post("/:id/command", command);

export default router;