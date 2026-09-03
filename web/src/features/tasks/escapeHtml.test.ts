import { test } from 'node:test';
import assert from 'node:assert/strict';
import { escapeHtml } from './escapeHtml.ts';

test('escapeHtml: escapes HTML-significant characters', () => {
  assert.equal(escapeHtml('<script>alert("x")</script>'), '&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;');
});

test('escapeHtml: leaves plain text unchanged', () => {
  assert.equal(escapeHtml('Buy milk'), 'Buy milk');
});
