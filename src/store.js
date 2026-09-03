const users = new Map();
const tasks = [];

function addUser(user) {
  users.set(user.id, user);
}

function getUser(id) {
  return users.get(id);
}

function addTask(task) {
  tasks.push(task);
}

function getTasksForUser(userId) {
  return tasks.filter((t) => t.userId === userId);
}

function reset() {
  users.clear();
  tasks.length = 0;
}

module.exports = { addUser, getUser, addTask, getTasksForUser, reset };
