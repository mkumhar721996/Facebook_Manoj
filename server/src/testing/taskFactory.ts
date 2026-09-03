import type { Task } from '../tasks/task.types.ts';

export const DEFAULT_TEST_USER_ID = 'user-1';

export function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: overrides.id ?? 'id-1',
    userId: overrides.userId ?? DEFAULT_TEST_USER_ID,
    title: overrides.title ?? 'Untitled',
    description: overrides.description ?? '',
    status: overrides.status ?? 'incomplete',
    priority: overrides.priority ?? 'low',
    tags: overrides.tags ?? [],
    category: overrides.category ?? 'general',
    dueDate: overrides.dueDate ?? null,
  };
}
