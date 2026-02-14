import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../../../models/user.model.js';
import Task from '../../../models/task.model.js';
import { JWT_SECRET, JWT_EXPIRES_IN } from '../../../config/jwt.config.js';
import { OPENROUTER_API_KEY, OPENROUTER_URL } from '../../../config/openrouter.config.js';

export const register = async (name, email, password) => {
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    const err = new Error('User already exists with this email');
    err.statusCode = 400;
    throw err;
  }
  const hashed = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email: email.toLowerCase(), password: hashed });
  const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  return { user: { id: user._id, name: user.name, email: user.email }, token };
};

export const login = async (email, password) => {
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    const err = new Error('Invalid email or password');
    err.statusCode = 401;
    throw err;
  }
  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    const err = new Error('Invalid email or password');
    err.statusCode = 401;
    throw err;
  }
  const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  return { user: { id: user._id, name: user.name, email: user.email }, token };
};

export const createTask = async (userId, body) => {
  const task = await Task.create({ ...body, user: userId });
  return task;
};

export const getTasksByUser = async (userId) => {
  return Task.find({ user: userId }).sort({ createdAt: -1 }).lean();
};

export const getTaskById = async (taskId, userId) => {
  const task = await Task.findOne({ _id: taskId, user: userId }).lean();
  if (!task) {
    const err = new Error('Task not found');
    err.statusCode = 404;
    throw err;
  }
  return task;
};

export const updateTask = async (taskId, userId, body) => {
  const task = await Task.findOneAndUpdate(
    { _id: taskId, user: userId },
    { $set: body },
    { new: true, runValidators: true }
  );
  if (!task) {
    const err = new Error('Task not found');
    err.statusCode = 404;
    throw err;
  }
  return task;
};

export const deleteTask = async (taskId, userId) => {
  const result = await Task.findOneAndDelete({ _id: taskId, user: userId });
  if (!result) {
    const err = new Error('Task not found');
    err.statusCode = 404;
    throw err;
  }
  return result;
};

const TASK_LIST_SIZE = 5;

function parseTaskListJson(text) {
  if (!text || typeof text !== 'string') return null;
  let raw = text.trim();
  const codeBlock = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlock) raw = codeBlock[1].trim();
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    return parsed
      .filter((item) => item && typeof item.userStory === 'string' && typeof item.engineeringTask === 'string')
      .map((item) => ({ userStory: item.userStory, engineeringTask: item.engineeringTask }));
  } catch {
    return null;
  }
}

function ensureLengthFive(arr) {
  if (!arr || arr.length === 0) return null;
  if (arr.length >= TASK_LIST_SIZE) return arr.slice(0, TASK_LIST_SIZE);
  const pad = { userStory: 'TBD', engineeringTask: 'TBD' };
  return [...arr, ...Array(TASK_LIST_SIZE - arr.length).fill(null).map(() => ({ ...pad }))];
}

export const generateTaskListFromIdea = async (goal, endUsers, constraints) => {
  const goalStr = String(goal ?? '').trim();
  const endUsersStr = String(endUsers ?? '').trim();
  const constraintsStr = String(constraints ?? '').trim();

  const prompt = `Goal: ${goalStr || '(none)'}\nEnd users: ${endUsersStr || '(none)'}\nConstraints: ${constraintsStr || '(none)'}

Return ONLY a JSON array of exactly 5 objects. Each object: "userStory" (string) and "engineeringTask" (string). No other text.`;

  console.log(process.env.OPENROUTER_URL);
  console.log(process.env.OPENROUTER_API_KEY);



  const res = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENROUTER_API_KEY}`
    },
    body: JSON.stringify({
      model: 'openai/gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1024,
      temperature: 0.5
    })
  });

  if (!res.ok) {
    const err = new Error('AI generation failed');
    err.statusCode = res.status;
    throw err;
  }

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  const parsed = parseTaskListJson(content);
  const taskList = ensureLengthFive(parsed);

  if (!taskList || taskList.length !== TASK_LIST_SIZE) {
    const err = new Error('Invalid or incomplete task list from AI');
    err.statusCode = 502;
    throw err;
  }

  return taskList;
};
