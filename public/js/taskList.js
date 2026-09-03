function render(tasks) {
  return tasks
    .map(
      (task) => `
    <li class="task-item${task.completed ? ' completed' : ''}" data-id="${task.id}">
      <input type="checkbox" data-action="toggle" data-id="${task.id}" ${task.completed ? 'checked' : ''} />
      <span class="task-title">${task.title}</span>
      <button type="button" data-action="delete" data-id="${task.id}">Delete</button>
    </li>`
    )
    .join('');
}

async function toggleTask(tasks, id, { fetchImpl = fetch } = {}) {
  const response = await fetchImpl(`/api/tasks/${id}/toggle`, { method: 'PATCH' });
  const updated = await response.json();
  return tasks.map((task) => (task.id === id ? { ...task, completed: updated.completed } : task));
}

async function deleteTask(tasks, id, { fetchImpl = fetch, confirmImpl = confirm } = {}) {
  const confirmed = confirmImpl('Are you sure you want to permanently delete this task?');
  if (!confirmed) {
    return tasks;
  }
  await fetchImpl(`/api/tasks/${id}`, { method: 'DELETE' });
  return tasks.filter((task) => task.id !== id);
}

function mount(container, initialTasks, deps = {}) {
  let tasks = initialTasks;

  function draw() {
    container.innerHTML = render(tasks);
  }

  container.addEventListener('click', async (event) => {
    const target = event.target.closest('[data-action]');
    if (!target) return;
    const { action, id } = target.dataset;

    if (action === 'toggle') {
      tasks = await toggleTask(tasks, id, deps);
      draw();
    } else if (action === 'delete') {
      tasks = await deleteTask(tasks, id, deps);
      draw();
    }
  });

  draw();
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { render, toggleTask, deleteTask, mount };
}
