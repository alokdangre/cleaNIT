import express from 'express';
import { submitComplaint, assignComplaintToEmployee, submitWork } from '../controllers/complaintController.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
const router = express.Router();

router.post('/submitComplaint', submitComplaint);
router.post('/receiveComplaint', authenticateToken, authorizeRoles('employee'), assignComplaintToEmployee);
router.post('/submitWork', authenticateToken, authorizeRoles('employee'), submitWork);

export default router;