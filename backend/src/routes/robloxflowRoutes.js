import express from "express";
import { analyzeImage } from "../controllers/robloxflowController.js";
import { authenticateToken, authorizeRoles } from "../middleware/auth.js";

const router = express.Router();
router.post("/analyze", authenticateToken, authorizeRoles("employee"),analyzeImage);

export default router;
