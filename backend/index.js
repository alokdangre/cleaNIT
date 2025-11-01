import express from 'express';
import { PORT } from './src/config/env.js';
import fileUpload from "express-fileupload";
import { connectDatabase } from './src/config/database.js';
import {connectCloudinary} from "./src/config/cloudinaryConfig.js";
import authRoutes from './src/routes/authRoutes.js';
import protectedRoutes from './src/routes/protectedRoutes.js';
import cloudinaryRoutes from './src/routes/cloudinaryRoutes.js';

const app = express();

app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: "./tmp/",
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit
  })
);

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use('/auth', authRoutes);
app.use('/cloudinary', cloudinaryRoutes);
app.use('/', protectedRoutes);

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const startServer = async () => {
  await connectDatabase();
  await connectCloudinary();

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();
