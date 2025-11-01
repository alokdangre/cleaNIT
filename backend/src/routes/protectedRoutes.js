import express from 'express';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

router.get('/profile', authenticateToken, (req, res) => {
  res.json({ message: 'Authenticated profile', user: req.user });
});

router.get('/student/dashboard', authenticateToken, authorizeRoles('student'), (req, res) => {
  res.json({ message: `Welcome student ${req.user.username}` });
});

router.get('/employee/dashboard', authenticateToken, authorizeRoles('employee'), (req, res) => {
  res.json({ message: `Welcome employee ${req.user.username}` });
});

export default router;
