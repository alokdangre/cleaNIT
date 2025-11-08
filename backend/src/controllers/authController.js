import bcrypt from 'bcryptjs';
import { createEmployeeProfile, createStudentProfile } from '../services/profileService.js';
import { createUser, deleteUserById, findByUsername } from '../services/userService.js';
import { generateToken } from '../utils/token.js';

const normalizeRole = (role) => role.toLowerCase();

const validateStudentProfile = (profile) => {
  if (!profile) {
    return 'Student profile data is required';
  }

  const requiredFields = ['rollNumber', 'name', 'email'];
  const missing = requiredFields.filter((field) => !profile[field]);
  if (missing.length) {
    return `Missing student profile fields: ${missing.join(', ')}`;
  }

  return null;
};

const validateEmployeeProfile = (profile) => {
  if (!profile) {
    return 'Employee profile data is required';
  }

  const requiredFields = ['name', 'phoneNumber', 'areaAssigned'];
  const missing = requiredFields.filter((field) => !profile[field]);
  if (missing.length) {
    return `Missing employee profile fields: ${missing.join(', ')}`;
  }

  return null;
};

export const register = async (req, res) => {
  const { username, password, role, profile } = req.body;

  if (!username || !password || !role) {
    return res.status(400).json({ message: 'username, password and role are required' });
  }

  const normalizedRole = normalizeRole(role);
  if (!['student', 'employee'].includes(normalizedRole)) {
    return res.status(400).json({ message: 'role must be either student or employee' });
  }

  if (normalizedRole === 'student') {
    const validationError = validateStudentProfile(profile);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }
  }

  if (normalizedRole === 'employee') {
    const validationError = validateEmployeeProfile(profile);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }
  }

  const existingUser = await findByUsername(username);
  if (existingUser) {
    return res.status(409).json({ message: 'Username already taken' });
  }

  let newUser;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    newUser = await createUser({ username, password: hashedPassword, role: normalizedRole });

    if (normalizedRole === 'student') {
      await createStudentProfile({
        user: newUser.id,
        rollNumber: profile.rollNumber,
        name: profile.name,
        email: profile.email,
        password: hashedPassword,
        reportedComplaints: profile.reportedComplaints,
      });
    } else if (normalizedRole === 'employee') {
      await createEmployeeProfile({
        user: newUser.id,
        name: profile.name,
        phoneNumber: profile.phoneNumber,
        areaAssigned: profile.areaAssigned,
        password: hashedPassword,
        workDone: profile.workDone,
      });
    }

    const token = generateToken({ id: newUser.id, username, role: normalizedRole });

    return res.status(201).json({
      token,
      user: { id: newUser.id, username, role: normalizedRole },
    });
  } catch (error) {
    if (newUser) {
      await deleteUserById(newUser.id);
    }

    console.error('Registration failed:', error);

    if (error?.code === 11000) {
      const duplicateFields = Object.keys(error.keyPattern || {});
      const fieldList = duplicateFields.length ? duplicateFields.join(', ') : 'unique field';
      return res.status(409).json({ message: `Duplicate value for ${fieldList}` });
    }

    if (error?.name === 'ValidationError') {
      const validationMessages = Object.values(error.errors || {}).map((err) => err.message);
      const message = validationMessages[0] || error.message || 'Validation failed';
      return res.status(400).json({ message, errors: validationMessages });
    }

    return res.status(500).json({ message: 'Unable to register user' });
  }
};

export const login = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'username and password are required' });
  }

  const user = await findByUsername(username);
  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const token = generateToken({ id: user.id, username: user.username, role: user.role });
  return res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
};

