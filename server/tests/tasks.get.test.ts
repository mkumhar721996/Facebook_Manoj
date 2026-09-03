import { test } from "node:test";
import assert from "node:assert/strict";
import { authHeader, startTestServer } from "./testServer.ts";
import type { Task } from "../src/models/task.ts";

function makeTask(overrides: Partial<Task>): Task {
  return {
    id: "id",
    userId: "userA",
    title: "title",
    dueDate: "2026-01-01",
    priority: "low",
    createdAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function shuffledDueDates(count: number): string[] {
  const dates = Array.from({ length: count }, (_, i) =>
    new Date(2026, 0, i + 1).toISOString()
  );
  for (let i = dates.length - 1; i > 0; i--) {
    const j = (i * 7) % dates.length;
    [dates[i], dates[j]] = [dates[j], dates[i]];
  }
  return dates;
}

test("AC1: GET /api/tasks defaults to dueDate ascending, 10 per page", async () => {
  const dueDates = shuffledDueDates(15);
  const tasks: Task[] = dueDates.map((dueDate, i) =>
    makeTask({ id: `t${i}`, dueDate })
  );
  const server = await startTestServer(tasks);

  try {
    const response = await fetch(`${server.baseUrl}/api/tasks`, {
      headers: authHeader("userA"),
    });
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.tasks.length, 10);
    assert.equal(body.page, 1);
    assert.equal(body.pageSize, 10);

    const returnedDueDates = body.tasks.map((t: Task) => t.dueDate);
    const sorted = [...returnedDueDates].sort();
    assert.deepEqual(returnedDueDates, sorted);
  } finally {
    await server.close();
  }
});

const SORT_CASES: Array<{
  sortBy: "dueDate" | "priority" | "createdAt";
  order: "asc" | "desc";
}> = [
  { sortBy: "dueDate", order: "asc" },
  { sortBy: "dueDate", order: "desc" },
  { sortBy: "priority", order: "asc" },
  { sortBy: "priority", order: "desc" },
  { sortBy: "createdAt", order: "asc" },
  { sortBy: "createdAt", order: "desc" },
];

for (const { sortBy, order } of SORT_CASES) {
  test(`AC2: GET /api/tasks?sortBy=${sortBy}&order=${order} sorts correctly`, async () => {
    const priorities: Array<Task["priority"]> = ["high", "low", "medium"];
    const tasks: Task[] = priorities.map((priority, i) =>
      makeTask({
        id: `t${i}`,
        dueDate: new Date(2026, 0, priorities.length - i).toISOString(),
        createdAt: new Date(2026, 1, i + 1).toISOString(),
        priority,
      })
    );
    const server = await startTestServer(tasks);

    try {
      const response = await fetch(
        `${server.baseUrl}/api/tasks?sortBy=${sortBy}&order=${order}`,
        { headers: authHeader("userA") }
      );
      const body = await response.json();

      const values = body.tasks.map((t: Task) =>
        sortBy === "priority"
          ? { low: 0, medium: 1, high: 2 }[t.priority]
          : t[sortBy]
      );
      const expected = [...values].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
      if (order === "desc") expected.reverse();

      assert.deepEqual(values, expected);
    } finally {
      await server.close();
    }
  });
}

test("AC2: GET /api/tasks?sortBy=notAField falls back to default sort", async () => {
  const dueDates = shuffledDueDates(3);
  const tasks: Task[] = dueDates.map((dueDate, i) =>
    makeTask({ id: `t${i}`, dueDate })
  );
  const server = await startTestServer(tasks);

  try {
    const response = await fetch(`${server.baseUrl}/api/tasks?sortBy=notAField`, {
      headers: authHeader("userA"),
    });
    const body = await response.json();

    const returnedDueDates = body.tasks.map((t: Task) => t.dueDate);
    assert.deepEqual(returnedDueDates, [...returnedDueDates].sort());
  } finally {
    await server.close();
  }
});

test("AC4: GET /api/tasks with zero tasks returns empty list", async () => {
  const server = await startTestServer([]);

  try {
    const response = await fetch(`${server.baseUrl}/api/tasks`, {
      headers: authHeader("userA"),
    });
    const body = await response.json();

    assert.deepEqual(body.tasks, []);
    assert.equal(body.totalCount, 0);
    assert.equal(body.totalPages, 0);
  } finally {
    await server.close();
  }
});

test("AC5: GET /api/tasks only returns tasks belonging to the requesting user", async () => {
  const tasks: Task[] = [
    makeTask({ id: "a1", userId: "userA" }),
    makeTask({ id: "a2", userId: "userA" }),
    makeTask({ id: "b1", userId: "userB" }),
  ];
  const server = await startTestServer(tasks);

  try {
    const response = await fetch(`${server.baseUrl}/api/tasks`, {
      headers: authHeader("userA"),
    });
    const body = await response.json();

    assert.equal(body.totalCount, 2);
    assert.ok(body.tasks.every((t: Task) => t.userId === "userA"));
    assert.ok(!body.tasks.some((t: Task) => t.id === "b1"));
  } finally {
    await server.close();
  }
});

test("AC6: GET /api/tasks with exactly 10 tasks returns a single full page", async () => {
  const tasks: Task[] = Array.from({ length: 10 }, (_, i) =>
    makeTask({ id: `t${i}`, dueDate: new Date(2026, 0, i + 1).toISOString() })
  );
  const server = await startTestServer(tasks);

  try {
    const response = await fetch(`${server.baseUrl}/api/tasks`, {
      headers: authHeader("userA"),
    });
    const body = await response.json();

    assert.equal(body.tasks.length, 10);
    assert.equal(body.totalCount, 10);
    assert.equal(body.totalPages, 1);
  } finally {
    await server.close();
  }
});

test("AC7: GET /api/tasks with 11 tasks splits across two pages", async () => {
  const tasks: Task[] = Array.from({ length: 11 }, (_, i) =>
    makeTask({ id: `t${i}`, dueDate: new Date(2026, 0, i + 1).toISOString() })
  );
  const server = await startTestServer(tasks);

  try {
    const page1 = await (
      await fetch(`${server.baseUrl}/api/tasks`, {
        headers: authHeader("userA"),
      })
    ).json();
    assert.equal(page1.tasks.length, 10);
    assert.equal(page1.totalPages, 2);

    const page2 = await (
      await fetch(`${server.baseUrl}/api/tasks?page=2`, {
        headers: authHeader("userA"),
      })
    ).json();
    assert.equal(page2.tasks.length, 1);
    assert.equal(page2.tasks[0].id, "t10");
  } finally {
    await server.close();
  }
});
