import { test } from "node:test";
import assert from "node:assert/strict";
import { getMenu } from "./menuClient.js";

test("getMenu sends the given trace id as an X-Trace-ID header so backend logs can be correlated", async () => {
  let capturedHeaders;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, init) => {
    capturedHeaders = init?.headers;
    return new Response(JSON.stringify({ items: [] }), { status: 200 });
  };

  try {
    await getMenu("open-burger-shack", "http://localhost:8010", "trace-abc-123");
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.equal(capturedHeaders?.["X-Trace-ID"], "trace-abc-123");
});
