import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/env.js';

export const generateToken = (payload, options = {}) =>
  jwt.sign(payload, JWT_SECRET, { expiresIn: '1h', ...options });
