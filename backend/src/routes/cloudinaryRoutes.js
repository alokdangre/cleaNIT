import express from 'express';
import { uploadHandler, deleteHandler } from '../controllers/cloudinaryController.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

router.post('/upload', authenticateToken, authorizeRoles('employee'), uploadHandler);
router.post('/delete', authenticateToken, deleteHandler);

export default router;