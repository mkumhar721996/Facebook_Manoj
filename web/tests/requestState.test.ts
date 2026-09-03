import { test } from "node:test";
import assert from "node:assert/strict";
import { parseRequestedSort, parseRequestedPage } from "../src/rendering/requestState.ts";

test("AC1: parseRequestedSort defaults to dueDate/asc when absent", () => {
  const sort = parseRequestedSort(new URLSearchParams());
  assert.deepEqual(sort, { sortBy: "dueDate", order: "asc" });
});

test("AC2: parseRequestedSort reads valid sortBy/order from the query string", () => {
  const sort = parseRequestedSort(new URLSearchParams("sortBy=priority&order=desc"));
  assert.deepEqual(sort, { sortBy: "priority", order: "desc" });
});

test("AC2: parseRequestedSort falls back to defaults for an unknown sortBy", () => {
  const sort = parseRequestedSort(new URLSearchParams("sortBy=notAField&order=desc"));
  assert.deepEqual(sort, { sortBy: "dueDate", order: "asc" });
});

test("AC1: parseRequestedPage defaults to 1 when absent", () => {
  assert.equal(parseRequestedPage(new URLSearchParams()), 1);
});

test("AC3: parseRequestedPage reads a valid page number", () => {
  assert.equal(parseRequestedPage(new URLSearchParams("page=2")), 2);
});
