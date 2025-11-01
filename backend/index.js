import express from 'express';
import { PORT } from './src/config/env.js';
import { connectDatabase } from './src/config/database.js';
import authRoutes from './src/routes/authRoutes.js';
import protectedRoutes from './src/routes/protectedRoutes.js';

const app = express();

app.use(express.json());

app.use('/auth', authRoutes);
app.use('/', protectedRoutes);

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const startServer = async () => {
  await connectDatabase();

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();
