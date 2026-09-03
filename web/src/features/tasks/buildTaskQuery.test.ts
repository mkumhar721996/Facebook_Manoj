import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildTaskQuery } from './buildTaskQuery.ts';

test('buildTaskQuery: includes search term', () => {
  const query = buildTaskQuery({ search: 'foo' });
  assert.equal(query, 'search=foo');
});

test('buildTaskQuery: includes status', () => {
  const query = buildTaskQuery({ status: 'complete' });
  assert.equal(query, 'status=complete');
});

test('buildTaskQuery: includes priority', () => {
  const query = buildTaskQuery({ priority: 'high' });
  assert.equal(query, 'priority=high');
});

test('buildTaskQuery: includes tag', () => {
  const query = buildTaskQuery({ tag: 'urgent' });
  assert.equal(query, 'tag=urgent');
});

test('buildTaskQuery: includes category', () => {
  const query = buildTaskQuery({ category: 'work' });
  assert.equal(query, 'category=work');
});

test('buildTaskQuery: includes dueStart and dueEnd', () => {
  const query = buildTaskQuery({ dueStart: '2026-09-01', dueEnd: '2026-09-10' });
  assert.equal(query, 'dueStart=2026-09-01&dueEnd=2026-09-10');
});

test('buildTaskQuery: combines multiple filters', () => {
  const query = buildTaskQuery({ search: 'foo', status: 'incomplete', priority: 'high' });
  assert.equal(query, 'search=foo&status=incomplete&priority=high');
});

test('buildTaskQuery: with no filters returns empty string', () => {
  const query = buildTaskQuery({});
  assert.equal(query, '');
});

test('buildTaskQuery: encodes special characters in filter values', () => {
  const query = buildTaskQuery({ search: 'a b&c' });
  assert.equal(query, 'search=a+b%26c');
});
