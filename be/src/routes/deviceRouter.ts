import { Router } from "express";
import { heartbeat, index, show } from "../controllers/deviceController";

const router = Router();

router.get("/", index);
router.get("/:id", show);

export default router;