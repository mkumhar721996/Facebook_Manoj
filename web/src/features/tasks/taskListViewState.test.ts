import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getTaskListViewState } from './taskListViewState.ts';
import type { Task } from './task.types.ts';

function makeTask(id: string): Task {
  return {
    id,
    title: 'Task',
    description: '',
    status: 'incomplete',
    priority: 'low',
    tags: [],
    category: 'general',
    dueDate: null,
  };
}

test('getTaskListViewState: with tasks, is not empty and has no message', () => {
  const state = getTaskListViewState([makeTask('a')]);
  assert.equal(state.isEmpty, false);
  assert.equal(state.emptyMessage, null);
});

test('getTaskListViewState: with no tasks, is empty and has a message', () => {
  const state = getTaskListViewState([]);
  assert.equal(state.isEmpty, true);
  assert.equal(state.emptyMessage, 'No tasks match your filters.');
});
