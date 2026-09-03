import { fetchTasks } from './api.ts';
import { escapeHtml } from './escapeHtml.ts';
import { clearFilters, updateFilter } from './filterState.ts';
import { TASK_LOAD_ERROR_MESSAGE } from './taskListErrorMessage.ts';
import { getTaskListViewState } from './taskListViewState.ts';
import type { TaskFilters } from './task.types.ts';

const FILTER_FIELDS: (keyof TaskFilters)[] = [
  'search',
  'status',
  'priority',
  'tag',
  'category',
  'dueStart',
  'dueEnd',
];

function isFilterField(name: string): name is keyof TaskFilters {
  return (FILTER_FIELDS as string[]).includes(name);
}

export function mountTaskListPage(root: HTMLElement): void {
  let filters: TaskFilters = {};

  root.innerHTML = `
    <form id="task-filters">
      <input name="search" type="text" placeholder="Search" aria-label="Search" />
      <select name="status" aria-label="Status">
        <option value="">Any status</option>
        <option value="incomplete">Incomplete</option>
        <option value="complete">Complete</option>
      </select>
      <select name="priority" aria-label="Priority">
        <option value="">Any priority</option>
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
      </select>
      <input name="tag" type="text" placeholder="Tag" aria-label="Tag" />
      <input name="category" type="text" placeholder="Category" aria-label="Category" />
      <input name="dueStart" type="date" aria-label="Due after" />
      <input name="dueEnd" type="date" aria-label="Due before" />
      <button type="button" id="clear-filters">Clear filters</button>
    </form>
    <div id="task-list"></div>
  `;

  const form = root.querySelector<HTMLFormElement>('#task-filters');
  const listEl = root.querySelector<HTMLElement>('#task-list');
  if (!form || !listEl) throw new Error('TaskListPage: expected markup missing');

  async function refresh(): Promise<void> {
    let tasks;
    try {
      tasks = await fetchTasks(filters);
    } catch (error) {
      console.error('Failed to load tasks', error);
      listEl!.textContent = TASK_LOAD_ERROR_MESSAGE;
      return;
    }

    const state = getTaskListViewState(tasks);
    if (state.isEmpty) {
      listEl!.textContent = state.emptyMessage;
      return;
    }
    listEl!.innerHTML = state.tasks
      .map((task) => `<div class="task">${escapeHtml(task.title)}</div>`)
      .join('');
  }

  form.addEventListener('input', (event) => {
    const target = event.target as HTMLInputElement | HTMLSelectElement;
    if (!isFilterField(target.name)) return;
    filters = updateFilter(filters, target.name, target.value);
    void refresh();
  });

  root.querySelector('#clear-filters')?.addEventListener('click', () => {
    filters = clearFilters();
    form.querySelectorAll('input, select').forEach((element) => {
      (element as HTMLInputElement | HTMLSelectElement).value = '';
    });
    void refresh();
  });

  void refresh();
}
