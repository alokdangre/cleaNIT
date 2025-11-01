import express from 'express';
import { submitComplaint, receiveComplaint, submitWork } from '../controllers/complaintController.js';
const router = express.Router();

router.post('/submitComplaint', submitComplaint);
router.post('/receiveComplaint', receiveComplaint);
router.post('/submitWork', submitWork);

export default router;