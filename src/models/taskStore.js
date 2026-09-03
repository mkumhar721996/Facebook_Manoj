let tasks = [];

function reset(seed = []) {
  tasks = seed.map((task) => ({ ...task }));
}

function list(userId) {
  return tasks.filter((task) => task.userId === userId).map((task) => ({ ...task }));
}

function toggle(id, userId) {
  const task = tasks.find((t) => t.id === id && t.userId === userId);
  if (!task) return null;
  task.completed = !task.completed;
  return { ...task };
}

function remove(id, userId) {
  const index = tasks.findIndex((t) => t.id === id && t.userId === userId);
  if (index === -1) return false;
  tasks.splice(index, 1);
  return true;
}

module.exports = { reset, list, toggle, remove };
