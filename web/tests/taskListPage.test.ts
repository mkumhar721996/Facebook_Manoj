import { test } from "node:test";
import assert from "node:assert/strict";
import { renderTaskListPage } from "../src/rendering/taskListPage.ts";
import type { Task, TaskListResult } from "../src/models/task.ts";

const sort = { sortBy: "dueDate" as const, order: "asc" as const };

function makeTasks(count: number): Task[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `t${i}`,
    userId: "userA",
    title: `Task ${i}`,
    dueDate: `2026-01-${String(i + 1).padStart(2, "0")}`,
    priority: "low" as const,
    createdAt: "2026-01-01T00:00:00.000Z",
  }));
}

test("AC4: renderTaskListPage shows an empty-state message and no table when there are no tasks", () => {
  const result: TaskListResult = {
    tasks: [],
    page: 1,
    pageSize: 10,
    totalCount: 0,
    totalPages: 0,
  };

  const html = renderTaskListPage(result, sort);

  assert.ok(html.includes("You have no tasks yet."));
  assert.ok(!html.includes("<table"));
  assert.ok(!html.includes("<nav"));
});

test("AC1/AC6: renderTaskListPage renders the table and pagination when tasks exist", () => {
  const tasks = makeTasks(10);
  const result: TaskListResult = {
    tasks,
    page: 1,
    pageSize: 10,
    totalCount: 10,
    totalPages: 1,
  };

  const html = renderTaskListPage(result, sort);

  assert.ok(html.includes("<table"));
  assert.ok(html.includes("<nav"));
  assert.ok(html.includes("Page 1 of 1"));
});
