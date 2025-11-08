import express from 'express';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import { getEmployeeDashboard, getStudentDashboard, listPublicComplaints } from '../controllers/complaintController.js';

const router = express.Router();

router.get('/profile', authenticateToken, (req, res) => {
  res.json({ message: 'Authenticated profile', user: req.user });
});

router.get('/public/complaints', listPublicComplaints);

router.get('/student/dashboard', authenticateToken, authorizeRoles('student'), getStudentDashboard);

router.get('/employee/dashboard', authenticateToken, authorizeRoles('employee'), getEmployeeDashboard);

export default router;
