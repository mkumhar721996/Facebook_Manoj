import test from "node:test";
import assert from "node:assert/strict";
import { createServer, createMetrics } from "../src/server.js";

async function withServer(server, fn) {
  await new Promise((resolve) => server.listen(0, resolve));
  const { port } = server.address();
  try {
    await fn(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

function fakeLogger() {
  const calls = { info: [], error: [] };
  return {
    calls,
    info: (...args) => calls.info.push(args),
    error: (...args) => calls.error.push(args),
  };
}

test("logs a structured entry with filters, status, and duration for a successful request (observability)", async () => {
  const logger = fakeLogger();
  const metrics = createMetrics();
  const server = createServer({ logger, metrics });

  await withServer(server, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/restaurants?search=dragon`);
    await response.json();

    assert.equal(logger.calls.info.length, 1);
    const [entry] = logger.calls.info[0];
    assert.equal(entry.filters.search, "dragon");
    assert.equal(entry.status, 200);
    assert.equal(typeof entry.durationMs, "number");
  });
});

test("increments request count on every call and leaves error count at zero on success (observability)", async () => {
  const metrics = createMetrics();
  const server = createServer({ logger: fakeLogger(), metrics });

  await withServer(server, async (baseUrl) => {
    await fetch(`${baseUrl}/api/restaurants`);
    await fetch(`${baseUrl}/api/restaurants`);

    assert.equal(metrics.requestCount, 2);
    assert.equal(metrics.errorCount, 0);
  });
});

test("when the listing implementation throws, responds 500, logs the error with filter context, and increments error count (observability)", async () => {
  const logger = fakeLogger();
  const metrics = createMetrics();
  const listRestaurantsImpl = () => {
    throw new Error("boom");
  };
  const server = createServer({ logger, metrics, listRestaurantsImpl });

  await withServer(server, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/restaurants?cuisine=Chinese`);

    assert.equal(response.status, 500);
    assert.equal(metrics.errorCount, 1);
    assert.equal(logger.calls.error.length, 1);
    const [entry] = logger.calls.error[0];
    assert.equal(entry.filters.cuisine, "Chinese");
    assert.equal(entry.error, "boom");
  });
});
