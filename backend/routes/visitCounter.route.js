import express from "express";
import { incrementVisit, getMyVisit, getTotalVisits } from "../controllers/visitCounter.controller.js";

const router = express.Router();

router.post("/increment", incrementVisit);
router.get("/me", getMyVisit);
router.get("/total", getTotalVisits);

export default router;