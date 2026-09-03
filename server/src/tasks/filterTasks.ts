import type { Task, TaskFilters } from './task.types.ts';

export function filterTasks(tasks: Task[], filters: TaskFilters): Task[] {
  const searchTerm = filters.search ? filters.search.toLowerCase() : undefined;
  return tasks.filter((task) => matchesFilters(task, filters, searchTerm));
}

function matchesFilters(task: Task, filters: TaskFilters, searchTerm: string | undefined): boolean {
  if (searchTerm) {
    const matchesSearch =
      task.title.toLowerCase().includes(searchTerm) ||
      task.description.toLowerCase().includes(searchTerm);
    if (!matchesSearch) return false;
  }

  if (filters.status && task.status !== filters.status) return false;
  if (filters.priority && task.priority !== filters.priority) return false;
  if (filters.tag && !task.tags.includes(filters.tag)) return false;
  if (filters.category && task.category !== filters.category) return false;

  if (filters.dueStart || filters.dueEnd) {
    if (!task.dueDate) return false;
    if (filters.dueStart && task.dueDate < filters.dueStart) return false;
    if (filters.dueEnd && task.dueDate > filters.dueEnd) return false;
  }

  return true;
}
