import { test } from 'node:test';
import assert from 'node:assert/strict';
import { clearFilters, updateFilter } from './filterState.ts';

test('updateFilter: sets a field on a copy of the filters', () => {
  const initial = { status: 'complete' as const };
  const result = updateFilter(initial, 'search', 'foo');

  assert.deepEqual(result, { status: 'complete', search: 'foo' });
  assert.deepEqual(initial, { status: 'complete' });
});

test('updateFilter: removes a field when set to an empty value', () => {
  const initial = { search: 'foo', status: 'complete' as const };
  const result = updateFilter(initial, 'search', '');

  assert.deepEqual(result, { status: 'complete' });
});

test('clearFilters: returns an empty filters object', () => {
  const result = clearFilters();
  assert.deepEqual(result, {});
});
