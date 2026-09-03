import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TASK_LOAD_ERROR_MESSAGE } from './taskListErrorMessage.ts';

test('TASK_LOAD_ERROR_MESSAGE: is a non-empty, user-facing message', () => {
  assert.equal(TASK_LOAD_ERROR_MESSAGE, 'Unable to load tasks. Please try again.');
});
