import type { Task } from './task.types.ts';

export interface TaskListViewState {
  tasks: Task[];
  isEmpty: boolean;
  emptyMessage: string | null;
}

export function getTaskListViewState(tasks: Task[]): TaskListViewState {
  const isEmpty = tasks.length === 0;
  return {
    tasks,
    isEmpty,
    emptyMessage: isEmpty ? 'No tasks match your filters.' : null,
  };
}
