import { buildTaskQuery } from './buildTaskQuery.ts';
import type { Task, TaskFilters } from './task.types.ts';

export async function fetchTasks(filters: TaskFilters): Promise<Task[]> {
  const query = buildTaskQuery(filters);
  const response = await fetch(`/api/tasks${query ? `?${query}` : ''}`);
  return response.json();
}
