import { test } from "node:test";
import assert from "node:assert/strict";
import { fetchTasks } from "../src/api/tasksApi.ts";

function stubFetch(capture: { url?: string; headers?: HeadersInit }) {
  return async (url: string, init?: RequestInit) => {
    capture.url = url;
    capture.headers = init?.headers;
    return new Response(
      JSON.stringify({ tasks: [], page: 1, pageSize: 10, totalCount: 0, totalPages: 0 }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  };
}

test("AC1: fetchTasks defaults to sortBy=dueDate&order=asc&page=1", async () => {
  const capture: { url?: string; headers?: HeadersInit } = {};
  await fetchTasks("http://api.local", "userA", {}, stubFetch(capture));

  assert.ok(capture.url?.includes("sortBy=dueDate"));
  assert.ok(capture.url?.includes("order=asc"));
  assert.ok(capture.url?.includes("page=1"));
});

test("AC5: fetchTasks sends the user id as the x-user-id header", async () => {
  const capture: { url?: string; headers?: HeadersInit } = {};
  await fetchTasks("http://api.local", "userA", {}, stubFetch(capture));

  assert.equal((capture.headers as Record<string, string>)["x-user-id"], "userA");
});

test("AC2: fetchTasks forwards an explicit sortBy/order/page", async () => {
  const capture: { url?: string; headers?: HeadersInit } = {};
  await fetchTasks(
    "http://api.local",
    "userA",
    { sortBy: "priority", order: "desc", page: 2 },
    stubFetch(capture)
  );

  assert.ok(capture.url?.includes("sortBy=priority"));
  assert.ok(capture.url?.includes("order=desc"));
  assert.ok(capture.url?.includes("page=2"));
});
