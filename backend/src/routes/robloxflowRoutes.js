import express from "express";
import { analyzeImage } from "../controllers/robloxflowController.js";

const router = express.Router();
router.post("/analyze", analyzeImage);

export default router;
