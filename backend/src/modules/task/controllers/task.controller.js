import * as taskService from '../services/task.service.js';

export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email and password are required.' });
    }
    const result = await taskService.register(name, email, password);
    res.status(201).json({ success: true, ...result });
  } catch (err) {
    const code = err.statusCode || 500;
    res.status(code).json({ success: false, message: err.message || 'Registration failed.' });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }
    const result = await taskService.login(email, password);
    res.json({ success: true, ...result });
  } catch (err) {
    const code = err.statusCode || 500;
    res.status(code).json({ success: false, message: err.message || 'Login failed.' });
  }
};

export const addTask = async (req, res) => {
  try {
    const { title, description, taskList } = req.body;
    if (!title || !description || !taskList?.length) {
      return res.status(400).json({ success: false, message: 'Title, description and taskList are required.' });
    }
    const task = await taskService.createTask(req.user._id, { title, description, taskList });
    res.status(201).json({ success: true, task });
  } catch (err) {
    const code = err.statusCode || 500;
    res.status(code).json({ success: false, message: err.message || 'Failed to add task.' });
  }
};

export const getTaskList = async (req, res) => {
  try {
    const tasks = await taskService.getTasksByUser(req.user._id);
    res.json({ success: true, tasks });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to get tasks.' });
  }
};

export const getTask = async (req, res) => {
  try {
    const task = await taskService.getTaskById(req.params.id, req.user._id);
    res.json({ success: true, task });
  } catch (err) {
    const code = err.statusCode || 500;
    res.status(code).json({ success: false, message: err.message || 'Failed to get task.' });
  }
};

export const updateTask = async (req, res) => {
  try {
    const { title, description, taskList } = req.body;
    const updates = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (taskList !== undefined) updates.taskList = taskList;
    const task = await taskService.updateTask(req.params.id, req.user._id, updates);
    res.json({ success: true, task });
  } catch (err) {
    const code = err.statusCode || 500;
    res.status(code).json({ success: false, message: err.message || 'Failed to update task.' });
  }
};

export const deleteTask = async (req, res) => {
  try {
    await taskService.deleteTask(req.params.id, req.user._id);
    res.json({ success: true, message: 'Task deleted.' });
  } catch (err) {
    const code = err.statusCode || 500;
    res.status(code).json({ success: false, message: err.message || 'Failed to delete task.' });
  }
};

export const generateTaskList = async (req, res) => {
  try {
    const goal = req.body.goal != null ? String(req.body.goal) : '';
    const endUsers = req.body.endUsers != null ? String(req.body.endUsers) : (req.body.users != null ? String(req.body.users) : '');
    const constraints = req.body.constraints != null ? String(req.body.constraints) : '';
    const taskList = await taskService.generateTaskListFromIdea(goal, endUsers, constraints);
    res.json(taskList);
  } catch (err) {
    const code = err.statusCode || 500;
    res.status(code).json({ success: false, message: err.message || 'Failed to generate task list.' });
  }
};
