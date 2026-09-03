import { test } from "node:test";
import assert from "node:assert/strict";
import type { Server } from "node:http";
import { createApp } from "../../server/src/app.ts";
import { InMemoryTaskRepository } from "../../server/src/repositories/taskRepository.ts";
import type { Task } from "../../server/src/models/task.ts";
import { createWebServer } from "../src/server.ts";
import { createSessionCookie } from "../src/session.ts";

const TEST_SESSION_SECRET = "test-session-secret";

function makeTasks(count: number, userId = "userA"): Task[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `t${i}`,
    userId,
    title: `Task ${i}`,
    dueDate: new Date(2026, 0, i + 1).toISOString(),
    priority: "low" as const,
    createdAt: new Date(2026, 0, i + 1).toISOString(),
  }));
}

function listen(server: Server): Promise<string> {
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      const port = typeof address === "object" && address ? address.port : 0;
      resolve(`http://127.0.0.1:${port}`);
    });
  });
}

function close(server: Server): Promise<void> {
  return new Promise((resolve) => server.close(() => resolve()));
}

async function startStack(tasks: Task[]) {
  const apiServer = createApp(new InMemoryTaskRepository(tasks));
  const apiBaseUrl = await listen(apiServer);
  const webServer = createWebServer(apiBaseUrl, TEST_SESSION_SECRET);
  const webBaseUrl = await listen(webServer);
  return {
    webBaseUrl,
    close: async () => {
      await close(webServer);
      await close(apiServer);
    },
  };
}

function countBodyRows(html: string): number {
  const tbody = html.match(/<tbody>([\s\S]*?)<\/tbody>/)?.[1] ?? "";
  return (tbody.match(/<tr>/g) ?? []).length;
}

function sessionCookieFor(userId: string): string {
  return createSessionCookie(userId, TEST_SESSION_SECRET);
}

test("AC5: GET /tasks without a logged-in cookie is rejected", async () => {
  const stack = await startStack([]);
  try {
    const response = await fetch(`${stack.webBaseUrl}/tasks`);
    assert.equal(response.status, 401);
  } finally {
    await stack.close();
  }
});

test("AC1/AC7: GET /tasks renders page 1 of 10 rows for an 11-task user, and page 2 the remaining 1", async () => {
  const stack = await startStack(makeTasks(11));
  try {
    const cookie = sessionCookieFor("userA");

    const page1Html = await (
      await fetch(`${stack.webBaseUrl}/tasks`, { headers: { Cookie: cookie } })
    ).text();
    assert.equal(countBodyRows(page1Html), 10);
    assert.ok(page1Html.includes("Page 1 of 2"));

    const page2Html = await (
      await fetch(`${stack.webBaseUrl}/tasks?page=2`, { headers: { Cookie: cookie } })
    ).text();
    assert.equal(countBodyRows(page2Html), 1);
    assert.ok(page2Html.includes("Page 2 of 2"));
  } finally {
    await stack.close();
  }
});

test("AC4: GET /tasks shows the empty state for a user with no tasks", async () => {
  const stack = await startStack([]);
  try {
    const cookie = sessionCookieFor("userA");
    const html = await (
      await fetch(`${stack.webBaseUrl}/tasks`, { headers: { Cookie: cookie } })
    ).text();
    assert.ok(html.includes("You have no tasks yet."));
  } finally {
    await stack.close();
  }
});

test("AC5: GET /tasks only shows the logged-in user's tasks", async () => {
  const tasks = [...makeTasks(2, "userA"), ...makeTasks(1, "userB")];
  const stack = await startStack(tasks);
  try {
    const cookie = sessionCookieFor("userA");
    const html = await (
      await fetch(`${stack.webBaseUrl}/tasks`, { headers: { Cookie: cookie } })
    ).text();
    assert.equal(countBodyRows(html), 2);
  } finally {
    await stack.close();
  }
});

test("review: GET /tasks returns 500 instead of crashing when the API call fails", async () => {
  const failingFetch = async () => {
    throw new Error("connection refused");
  };
  const webServer = createWebServer(
    "http://api.invalid",
    TEST_SESSION_SECRET,
    failingFetch as typeof fetch
  );
  const webBaseUrl = await listen(webServer);

  try {
    const response = await fetch(`${webBaseUrl}/tasks`, {
      headers: { Cookie: sessionCookieFor("userA") },
    });
    assert.equal(response.status, 500);
  } finally {
    await close(webServer);
  }
});

test("security: GET /tasks with a forged, unsigned userId cookie is rejected (IDOR)", async () => {
  const tasks = makeTasks(1, "victim");
  const stack = await startStack(tasks);
  try {
    const forgedCookie = "session=victim.deadbeef";
    const response = await fetch(`${stack.webBaseUrl}/tasks`, {
      headers: { Cookie: forgedCookie },
    });
    assert.equal(response.status, 401);
  } finally {
    await stack.close();
  }
});

test("security: GET /login no longer exists as a self-service impersonation endpoint", async () => {
  const stack = await startStack([]);
  try {
    const response = await fetch(`${stack.webBaseUrl}/login?userId=bob`, {
      redirect: "manual",
    });
    assert.equal(response.status, 404);
    assert.equal(response.headers.get("set-cookie"), null);
  } finally {
    await stack.close();
  }
});
