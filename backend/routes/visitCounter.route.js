import express from "express";
import { incrementVisit, getMyVisit } from "../controllers/visitCounter.controller.js";

const router = express.Router();

router.post("/increment", incrementVisit);
router.get("/me", getMyVisit);

export default router;