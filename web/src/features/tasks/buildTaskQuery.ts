import type { TaskFilters } from './task.types.ts';

const FIELDS: (keyof TaskFilters)[] = [
  'search',
  'status',
  'priority',
  'tag',
  'category',
  'dueStart',
  'dueEnd',
];

export function buildTaskQuery(filters: TaskFilters): string {
  const params = new URLSearchParams();
  for (const field of FIELDS) {
    const value = filters[field];
    if (value) params.set(field, value);
  }
  return params.toString();
}
