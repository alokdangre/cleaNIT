import express from 'express';
import { uploadHandler, deleteHandler } from '../controllers/cloudinaryController.js';

const router = express.Router();

router.post('/upload', uploadHandler);
router.post('/delete', deleteHandler);

export default router;