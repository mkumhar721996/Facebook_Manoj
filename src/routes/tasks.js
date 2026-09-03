const taskStore = require('../store/taskStore');
const { validate } = require('../lib/taskValidation');

function createTask(userId, body) {
  const errors = validate(body);
  if (errors.length > 0) {
    return { status: 400, body: { errors } };
  }
  const task = taskStore.create(userId, body);
  return { status: 201, body: task };
}

function listTasks(userId) {
  return { status: 200, body: taskStore.list(userId) };
}

function updateTask(userId, id, patch) {
  const existing = taskStore.getById(userId, id);
  if (!existing) {
    return { status: 404, body: { errors: [{ field: 'id', message: 'Task not found.' }] } };
  }

  const merged = { ...existing, ...patch };
  const errors = validate(merged);
  if (errors.length > 0) {
    return { status: 400, body: { errors } };
  }

  const updated = taskStore.update(userId, id, patch);
  return { status: 200, body: updated };
}

module.exports = { createTask, listTasks, updateTask };
