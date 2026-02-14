import express from 'express';
import * as taskController from '../controllers/task.controller.js';
import { protect } from '../../../middleware/auth.middleware.js';

const router = express.Router();

// Auth
router.post('/register', taskController.register);
router.post('/login', taskController.login);

// Task APIs
router.post('/tasks/generate', protect, taskController.generateTaskList);
router.post('/tasks', protect, taskController.addTask);
router.get('/tasks', protect, taskController.getTaskList);
router.get('/tasks/:id', protect, taskController.getTask);
router.put('/tasks/:id', protect, taskController.updateTask);
router.delete('/tasks/:id', protect, taskController.deleteTask);

export default router;
