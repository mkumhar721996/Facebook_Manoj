import { test } from "node:test";
import assert from "node:assert/strict";
import { computeNextSort } from "../src/rendering/sort.ts";

test("AC2: clicking a new column sorts ascending and becomes the sole active sort", () => {
  const next = computeNextSort({ sortBy: "dueDate", order: "asc" }, "priority");
  assert.deepEqual(next, { sortBy: "priority", order: "asc" });
});

test("AC2: clicking the active column a second time reverses to descending", () => {
  const next = computeNextSort({ sortBy: "priority", order: "asc" }, "priority");
  assert.deepEqual(next, { sortBy: "priority", order: "desc" });
});

test("AC2: clicking a different column after a reversed sort resets to ascending on the new column", () => {
  const next = computeNextSort({ sortBy: "priority", order: "desc" }, "dueDate");
  assert.deepEqual(next, { sortBy: "dueDate", order: "asc" });
});
