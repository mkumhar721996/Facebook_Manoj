import type { TaskFilters } from './task.types.ts';

export function updateFilter(
  filters: TaskFilters,
  field: keyof TaskFilters,
  value: string,
): TaskFilters {
  const next = { ...filters };
  if (value) {
    (next as Record<string, string>)[field] = value;
  } else {
    delete next[field];
  }
  return next;
}

export function clearFilters(): TaskFilters {
  return {};
}
