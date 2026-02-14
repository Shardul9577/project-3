import express from 'express';
import cors from 'cors';
import taskRoutes from './modules/task/routes/task.routes.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/', (req, res) => {
  res.json({ 
    message: 'Server is running',
    status: 'success'
  });
});

app.use('/api/v1', taskRoutes);

export default app;
