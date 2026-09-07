import test from "node:test";
import assert from "node:assert/strict";
import { createController } from "../src/controller.js";

function makeFetchQueue(responses) {
  let call = 0;
  return async () => {
    const next = responses[Math.min(call, responses.length - 1)];
    call += 1;
    if (next.error) throw next.error;
    return { ok: next.ok !== false, status: next.status || 200, json: async () => next.body };
  };
}

test("load() transitions through loading then success and populates restaurants (AC1, AC7)", async () => {
  const states = [];
  const fetchImpl = makeFetchQueue([{ body: { restaurants: [{ id: "1", name: "Golden Dragon" }] } }]);
  const urls = [];
  const controller = createController({
    fetchImpl,
    baseUrl: "http://localhost:8008",
    initialSearch: "",
    onStateChange: (state) => states.push(state),
    onUrlChange: (search) => urls.push(search),
  });

  const loadPromise = controller.load();
  assert.equal(controller.getState().status, "loading");
  await loadPromise;

  assert.equal(controller.getState().status, "success");
  assert.deepEqual(controller.getState().restaurants, [{ id: "1", name: "Golden Dragon" }]);
});

test("setSearch updates the URL and reloads filtered results (AC2, AC4)", async () => {
  const fetchImpl = makeFetchQueue([
    { body: { restaurants: [] } },
    { body: { restaurants: [{ id: "2", name: "Bella Italia" }] } },
  ]);
  const urls = [];
  const controller = createController({
    fetchImpl,
    baseUrl: "http://localhost:8008",
    initialSearch: "",
    onStateChange: () => {},
    onUrlChange: (search) => urls.push(search),
  });

  await controller.load();
  await controller.setSearch("italia");

  assert.equal(controller.getState().search, "italia");
  assert.equal(urls[urls.length - 1], "?search=italia");
  assert.deepEqual(controller.getState().restaurants, [{ id: "2", name: "Bella Italia" }]);
});

test("clearFilters resets state, strips URL params, and restores the full listing (AC6)", async () => {
  const fetchImpl = makeFetchQueue([
    { body: { restaurants: [] } },
    { body: { restaurants: [{ id: "1" }, { id: "2" }] } },
  ]);
  const urls = [];
  const controller = createController({
    fetchImpl,
    baseUrl: "http://localhost:8008",
    initialSearch: "?search=nonexistent",
    onStateChange: () => {},
    onUrlChange: (search) => urls.push(search),
  });

  await controller.load();
  assert.equal(controller.getState().restaurants.length, 0);

  await controller.clearFilters();

  assert.equal(controller.getState().search, "");
  assert.equal(urls[urls.length - 1], "");
  assert.equal(controller.getState().restaurants.length, 2);
});

test("a failed fetch sets an error state, and retry() re-issues the request (AC8)", async () => {
  const fetchImpl = makeFetchQueue([
    { error: new Error("network down") },
    { body: { restaurants: [{ id: "1" }] } },
  ]);
  const controller = createController({
    fetchImpl,
    baseUrl: "http://localhost:8008",
    initialSearch: "",
    onStateChange: () => {},
    onUrlChange: () => {},
  });

  await controller.load();
  assert.equal(controller.getState().status, "error");

  await controller.retry();
  assert.equal(controller.getState().status, "success");
  assert.deepEqual(controller.getState().restaurants, [{ id: "1" }]);
});
