const { hashPassword } = require('./auth/password');

const users = new Map();
const tasksByUser = new Map();

function addUser({ id, password }) {
  const record = { id };
  if (password) {
    const { salt, hash } = hashPassword(password);
    record.passwordSalt = salt;
    record.passwordHash = hash;
  }
  users.set(id, record);
}

function getUser(id) {
  return users.get(id);
}

function addTask(task) {
  if (!tasksByUser.has(task.userId)) {
    tasksByUser.set(task.userId, []);
  }
  tasksByUser.get(task.userId).push(task);
}

function getTasksForUser(userId) {
  return tasksByUser.get(userId) || [];
}

function reset() {
  users.clear();
  tasksByUser.clear();
}

module.exports = { addUser, getUser, addTask, getTasksForUser, reset };
