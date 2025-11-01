import dotenv from "dotenv";
dotenv.config();

export const PORT = process.env.PORT || 3000;
export const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-prod';
export const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://localhost:27017/cleanit_dev';
export const CLOUD_NAME = process.env.CLOUD_NAME;
export const API_KEY = process.env.API_KEY;
export const API_SECRET = process.env.API_SECRET;
