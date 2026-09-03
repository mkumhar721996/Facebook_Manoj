import { test } from "node:test";
import assert from "node:assert/strict";
import type { Server } from "node:http";
import { createApp } from "../../server/src/app.ts";
import { InMemoryTaskRepository } from "../../server/src/repositories/taskRepository.ts";
import type { Task } from "../../server/src/models/task.ts";
import { createWebServer } from "../src/server.ts";

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
  const webServer = createWebServer(apiBaseUrl);
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

async function loginAndGetCookie(webBaseUrl: string, userId: string): Promise<string> {
  const response = await fetch(`${webBaseUrl}/login?userId=${userId}`, {
    redirect: "manual",
  });
  const setCookie = response.headers.get("set-cookie") ?? "";
  return setCookie.split(";")[0];
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
    const cookie = await loginAndGetCookie(stack.webBaseUrl, "userA");

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
    const cookie = await loginAndGetCookie(stack.webBaseUrl, "userA");
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
    const cookie = await loginAndGetCookie(stack.webBaseUrl, "userA");
    const html = await (
      await fetch(`${stack.webBaseUrl}/tasks`, { headers: { Cookie: cookie } })
    ).text();
    assert.equal(countBodyRows(html), 2);
  } finally {
    await stack.close();
  }
});
