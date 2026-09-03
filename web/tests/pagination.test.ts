import { test } from "node:test";
import assert from "node:assert/strict";
import { renderPagination } from "../src/rendering/pagination.ts";
import type { Sort } from "../src/models/task.ts";

const sort: Sort = { sortBy: "dueDate", order: "asc" };

test("AC3: renderPagination shows the current page indicator", () => {
  const html = renderPagination(2, 3, sort);
  assert.ok(html.includes("Page 2 of 3"));
});

test("AC3: renderPagination links to the next and previous pages, preserving sort", () => {
  const html = renderPagination(2, 3, sort);
  assert.ok(html.includes('href="?page=3&amp;sortBy=dueDate&amp;order=asc"'));
  assert.ok(html.includes('href="?page=1&amp;sortBy=dueDate&amp;order=asc"'));
});

test("AC6: renderPagination disables Next and Previous when there is only one page", () => {
  const html = renderPagination(1, 1, sort);
  const nextMatch = html.match(/<[^>]*data-action="next"[^>]*>/);
  const prevMatch = html.match(/<[^>]*data-action="prev"[^>]*>/);
  assert.ok(nextMatch && nextMatch[0].includes("disabled"));
  assert.ok(prevMatch && prevMatch[0].includes("disabled"));
});

test("AC7: renderPagination enables Next but disables Previous on the first of two pages", () => {
  const html = renderPagination(1, 2, sort);
  const nextMatch = html.match(/<[^>]*data-action="next"[^>]*>/);
  const prevMatch = html.match(/<[^>]*data-action="prev"[^>]*>/);
  assert.ok(nextMatch && !nextMatch[0].includes("disabled"));
  assert.ok(prevMatch && prevMatch[0].includes("disabled"));
});
