import { test } from "node:test";
import assert from "node:assert/strict";
import { startTestServer } from "./testServer.ts";

test("AC5: GET /api/tasks without x-user-id header returns 401", async () => {
  const server = await startTestServer([]);

  try {
    const response = await fetch(`${server.baseUrl}/api/tasks`);
    assert.equal(response.status, 401);
  } finally {
    await server.close();
  }
});
