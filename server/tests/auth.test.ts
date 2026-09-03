import { test } from "node:test";
import assert from "node:assert/strict";
import { startTestServer } from "./testServer.ts";
import type { Task } from "../src/models/task.ts";

test("AC5: GET /api/tasks without an auth header returns 401", async () => {
  const server = await startTestServer([]);

  try {
    const response = await fetch(`${server.baseUrl}/api/tasks`);
    assert.equal(response.status, 401);
  } finally {
    await server.close();
  }
});

test("security: GET /api/tasks with a plain, unsigned x-user-id header is rejected (IDOR)", async () => {
  const victimTask: Task = {
    id: "v1",
    userId: "victim",
    title: "secret task",
    dueDate: "2026-01-01",
    priority: "low",
    createdAt: "2026-01-01T00:00:00.000Z",
  };
  const server = await startTestServer([victimTask]);

  try {
    const response = await fetch(`${server.baseUrl}/api/tasks`, {
      headers: { "x-user-id": "victim" },
    });
    assert.equal(response.status, 401);
  } finally {
    await server.close();
  }
});

test("security: GET /api/tasks with a forged x-user-token signature is rejected (IDOR)", async () => {
  const victimTask: Task = {
    id: "v1",
    userId: "victim",
    title: "secret task",
    dueDate: "2026-01-01",
    priority: "low",
    createdAt: "2026-01-01T00:00:00.000Z",
  };
  const server = await startTestServer([victimTask]);

  try {
    const response = await fetch(`${server.baseUrl}/api/tasks`, {
      headers: { "x-user-token": "victim.deadbeef" },
    });
    assert.equal(response.status, 401);
  } finally {
    await server.close();
  }
});
