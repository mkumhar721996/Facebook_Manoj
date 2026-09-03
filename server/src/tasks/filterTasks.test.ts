import { test } from 'node:test';
import assert from 'node:assert/strict';
import { filterTasks } from './filterTasks.ts';
import type { Task } from './task.types.ts';

function makeTask(overrides: Partial<Task>): Task {
  return {
    id: overrides.id ?? 'id-1',
    userId: overrides.userId ?? 'user-1',
    title: overrides.title ?? 'Untitled',
    description: overrides.description ?? '',
    status: overrides.status ?? 'incomplete',
    priority: overrides.priority ?? 'low',
    tags: overrides.tags ?? [],
    category: overrides.category ?? 'general',
    dueDate: overrides.dueDate ?? null,
  };
}

test('filterTasks: matches search term in title case-insensitively', () => {
  const tasks: Task[] = [
    makeTask({ id: 'a', title: 'Buy Foo bar' }),
    makeTask({ id: 'b', title: 'Something else' }),
  ];

  const result = filterTasks(tasks, { search: 'FOO' });

  assert.deepEqual(result.map((t) => t.id), ['a']);
});

test('filterTasks: matches search term in description case-insensitively', () => {
  const tasks: Task[] = [
    makeTask({ id: 'a', title: 'Task A', description: 'contains foo term' }),
    makeTask({ id: 'b', title: 'Task B', description: 'no match here' }),
  ];

  const result = filterTasks(tasks, { search: 'FOO' });

  assert.deepEqual(result.map((t) => t.id), ['a']);
});

test('filterTasks: matches status filter', () => {
  const tasks: Task[] = [
    makeTask({ id: 'a', status: 'complete' }),
    makeTask({ id: 'b', status: 'incomplete' }),
  ];

  const result = filterTasks(tasks, { status: 'complete' });

  assert.deepEqual(result.map((t) => t.id), ['a']);
});

test('filterTasks: matches priority filter', () => {
  const tasks: Task[] = [
    makeTask({ id: 'a', priority: 'low' }),
    makeTask({ id: 'b', priority: 'medium' }),
    makeTask({ id: 'c', priority: 'high' }),
  ];

  const result = filterTasks(tasks, { priority: 'high' });

  assert.deepEqual(result.map((t) => t.id), ['c']);
});

test('filterTasks: matches tag filter', () => {
  const tasks: Task[] = [
    makeTask({ id: 'a', tags: ['urgent', 'home'] }),
    makeTask({ id: 'b', tags: ['home'] }),
  ];

  const result = filterTasks(tasks, { tag: 'urgent' });

  assert.deepEqual(result.map((t) => t.id), ['a']);
});

test('filterTasks: matches category filter', () => {
  const tasks: Task[] = [
    makeTask({ id: 'a', category: 'work' }),
    makeTask({ id: 'b', category: 'home' }),
  ];

  const result = filterTasks(tasks, { category: 'work' });

  assert.deepEqual(result.map((t) => t.id), ['a']);
});

test('filterTasks: dueStart returns tasks on or after the start date', () => {
  const tasks: Task[] = [
    makeTask({ id: 'a', dueDate: '2026-09-01' }),
    makeTask({ id: 'b', dueDate: '2026-09-05' }),
    makeTask({ id: 'c', dueDate: '2026-09-10' }),
  ];

  const result = filterTasks(tasks, { dueStart: '2026-09-05' });

  assert.deepEqual(result.map((t) => t.id), ['b', 'c']);
});

test('filterTasks: dueEnd returns tasks on or before the end date', () => {
  const tasks: Task[] = [
    makeTask({ id: 'a', dueDate: '2026-09-01' }),
    makeTask({ id: 'b', dueDate: '2026-09-05' }),
    makeTask({ id: 'c', dueDate: '2026-09-10' }),
  ];

  const result = filterTasks(tasks, { dueEnd: '2026-09-05' });

  assert.deepEqual(result.map((t) => t.id), ['a', 'b']);
});

test('filterTasks: dueStart and dueEnd together return tasks inclusively within range', () => {
  const tasks: Task[] = [
    makeTask({ id: 'a', dueDate: '2026-09-01' }),
    makeTask({ id: 'b', dueDate: '2026-09-05' }),
    makeTask({ id: 'c', dueDate: '2026-09-10' }),
  ];

  const result = filterTasks(tasks, { dueStart: '2026-09-05', dueEnd: '2026-09-10' });

  assert.deepEqual(result.map((t) => t.id), ['b', 'c']);
});

test('filterTasks: excludes tasks with no due date when a due-date filter is active', () => {
  const tasks: Task[] = [
    makeTask({ id: 'a', dueDate: null }),
    makeTask({ id: 'b', dueDate: '2026-09-05' }),
  ];

  const result = filterTasks(tasks, { dueStart: '2026-09-01' });

  assert.deepEqual(result.map((t) => t.id), ['b']);
});

test('filterTasks: combines multiple filters with AND semantics', () => {
  const tasks: Task[] = [
    makeTask({
      id: 'match',
      title: 'Foo task',
      status: 'incomplete',
      priority: 'high',
    }),
    makeTask({
      id: 'wrong-status',
      title: 'Foo task',
      status: 'complete',
      priority: 'high',
    }),
    makeTask({
      id: 'wrong-priority',
      title: 'Foo task',
      status: 'incomplete',
      priority: 'low',
    }),
    makeTask({
      id: 'wrong-search',
      title: 'Bar task',
      status: 'incomplete',
      priority: 'high',
    }),
  ];

  const result = filterTasks(tasks, { search: 'foo', status: 'incomplete', priority: 'high' });

  assert.deepEqual(result.map((t) => t.id), ['match']);
});

test('filterTasks: with no filters returns all tasks', () => {
  const tasks: Task[] = [makeTask({ id: 'a' }), makeTask({ id: 'b' })];

  const result = filterTasks(tasks, {});

  assert.deepEqual(result.map((t) => t.id), ['a', 'b']);
});
