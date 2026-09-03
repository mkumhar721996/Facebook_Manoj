import { test } from "node:test";
import assert from "node:assert/strict";
import { renderTaskTable } from "../src/rendering/taskTable.ts";
import type { Task } from "../src/models/task.ts";

const tasks: Task[] = [
  {
    id: "1",
    userId: "userA",
    title: "Write report",
    dueDate: "2026-01-05",
    priority: "high",
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "2",
    userId: "userA",
    title: "Buy groceries",
    dueDate: "2026-01-10",
    priority: "low",
    createdAt: "2026-01-02T00:00:00.000Z",
  },
];

test("AC1: renderTaskTable renders one row per task with title, due date, priority, created date", () => {
  const html = renderTaskTable(tasks, { sortBy: "dueDate", order: "asc" });

  assert.equal((html.match(/<tr/g) ?? []).length, tasks.length + 1);
  for (const task of tasks) {
    assert.ok(html.includes(task.title));
    assert.ok(html.includes(task.dueDate));
    assert.ok(html.includes(task.priority));
    assert.ok(html.includes(task.createdAt));
  }
});

test("AC2: renderTaskTable header links target sortBy=priority&order=asc when priority is not currently sorted", () => {
  const html = renderTaskTable(tasks, { sortBy: "dueDate", order: "asc" });
  assert.ok(html.includes('sortBy=priority&amp;order=asc'));
});

test("AC2: renderTaskTable header link reverses order when clicking the already-active sort column", () => {
  const html = renderTaskTable(tasks, { sortBy: "priority", order: "asc" });
  assert.ok(html.includes('sortBy=priority&amp;order=desc'));
});

test("AC2: renderTaskTable exposes due date and created date header links too", () => {
  const html = renderTaskTable(tasks, { sortBy: "dueDate", order: "asc" });
  assert.ok(html.includes('sortBy=dueDate&amp;order=desc'));
  assert.ok(html.includes('sortBy=createdAt&amp;order=asc'));
});
