import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
import { debounce } from './debounce.ts';

test('debounce: collapses rapid calls into a single trailing call', () => {
  mock.timers.enable({ apis: ['setTimeout'] });
  try {
    let callCount = 0;
    const debounced = debounce(() => {
      callCount += 1;
    }, 300);

    debounced();
    debounced();
    debounced();
    assert.equal(callCount, 0);

    mock.timers.tick(300);
    assert.equal(callCount, 1);
  } finally {
    mock.timers.reset();
  }
});

test('debounce: passes through the latest arguments', () => {
  mock.timers.enable({ apis: ['setTimeout'] });
  try {
    const received: string[] = [];
    const debounced = debounce((value: string) => {
      received.push(value);
    }, 300);

    debounced('first');
    debounced('second');
    mock.timers.tick(300);

    assert.deepEqual(received, ['second']);
  } finally {
    mock.timers.reset();
  }
});
