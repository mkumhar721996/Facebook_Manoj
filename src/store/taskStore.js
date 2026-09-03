const crypto = require('crypto');

const tasksByUser = new Map();

function list(userId) {
  return tasksByUser.get(userId) || [];
}

function getById(userId, id) {
  return list(userId).find((task) => task.id === id);
}

function create(userId, data) {
  const now = new Date().toISOString();
  const task = {
    id: crypto.randomUUID(),
    title: data.title,
    description: data.description ?? null,
    dueDate: data.dueDate ?? null,
    priority: data.priority ?? 'medium',
    tags: data.tags ?? [],
    category: data.category ?? null,
    createdAt: now,
    updatedAt: now,
  };
  const tasks = list(userId);
  tasks.push(task);
  tasksByUser.set(userId, tasks);
  return task;
}

function update(userId, id, patch) {
  const tasks = list(userId);
  const index = tasks.findIndex((task) => task.id === id);
  if (index === -1) return null;
  const updated = { ...tasks[index], ...patch, updatedAt: new Date().toISOString() };
  tasks[index] = updated;
  return updated;
}

module.exports = { list, getById, create, update };
