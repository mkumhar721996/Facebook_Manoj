const AUTH_TOKEN = 'demo-session-token';
const ESCAPE_MAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ESCAPE_MAP[char]);
}

function authHeaders() {
  return { Authorization: `Bearer ${AUTH_TOKEN}` };
}

function render(tasks) {
  return tasks
    .map((task) => {
      const id = escapeHtml(task.id);
      const title = escapeHtml(task.title);
      return `
    <li class="task-item${task.completed ? ' completed' : ''}" data-id="${id}">
      <input type="checkbox" data-action="toggle" data-id="${id}" ${task.completed ? 'checked' : ''} />
      <span class="task-title">${title}</span>
      <button type="button" data-action="delete" data-id="${id}">Delete</button>
    </li>`;
    })
    .join('');
}

async function toggleTask(tasks, id, { fetchImpl = fetch } = {}) {
  const response = await fetchImpl(`/api/tasks/${id}/toggle`, { method: 'PATCH', headers: authHeaders() });
  if (!response.ok) {
    throw new Error('Failed to toggle task');
  }
  const updated = await response.json();
  return tasks.map((task) => (task.id === id ? { ...task, completed: updated.completed } : task));
}

async function deleteTask(tasks, id, { fetchImpl = fetch, confirmImpl = confirm } = {}) {
  const confirmed = confirmImpl('Are you sure you want to permanently delete this task?');
  if (!confirmed) {
    return tasks;
  }
  const response = await fetchImpl(`/api/tasks/${id}`, { method: 'DELETE', headers: authHeaders() });
  if (!response.ok) {
    throw new Error('Failed to delete task');
  }
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

    try {
      if (action === 'toggle') {
        tasks = await toggleTask(tasks, id, deps);
        draw();
      } else if (action === 'delete') {
        tasks = await deleteTask(tasks, id, deps);
        draw();
      }
    } catch (err) {
      console.error(err);
    }
  });

  draw();
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { render, toggleTask, deleteTask, mount, AUTH_TOKEN };
} else {
  window.AUTH_TOKEN = AUTH_TOKEN;
}
