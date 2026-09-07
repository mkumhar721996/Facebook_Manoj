import { test } from "node:test";
import assert from "node:assert/strict";
import { getMenuResponse, type MenuStore } from "./menu.ts";
import type { MenuItem } from "../data/menuStore.ts";
import { createServer } from "../server.ts";
import { getCounter, resetMetrics } from "../observability/metrics.ts";

const fixtureItems: MenuItem[] = [
  {
    id: "classic-cheeseburger",
    name: "Classic Cheeseburger",
    description: "Beef patty, cheddar, lettuce, tomato, and house sauce on a toasted bun.",
    price: 8.99,
    customisationOptions: [
      { name: "Bun type", choices: ["Sesame", "Brioche"] },
      { name: "Toppings", choices: ["Pickles", "Onions"] },
    ],
  },
  {
    id: "veggie-burger",
    name: "Veggie Burger",
    description: "Grilled plant-based patty with avocado and chipotle mayo.",
    price: 9.49,
    customisationOptions: [{ name: "Spice level", choices: ["Mild", "Hot"] }],
  },
];

function fakeStore(items: MenuItem[] | undefined): MenuStore {
  return { getMenu: () => items };
}

test("returns 200 with items containing name, description, price and customisation options for a known restaurant id", () => {
  const response = getMenuResponse(fakeStore(fixtureItems), "open-burger-shack");

  assert.equal(response.status, 200);
  assert.deepEqual((response.body as { items: MenuItem[] }).items, fixtureItems);
});

test("returns 404 for an unknown restaurant id", () => {
  const response = getMenuResponse(fakeStore(undefined), "does-not-exist");

  assert.equal(response.status, 404);
  assert.ok("error" in response.body);
});

test("returns a 500 error response when the underlying data source fails", () => {
  const failingStore: MenuStore = {
    getMenu: () => {
      throw new Error("data source unavailable");
    },
  };

  const response = getMenuResponse(failingStore, "open-burger-shack");

  assert.equal(response.status, 500);
  assert.ok("error" in response.body);
});

test("logs the error and increments a failure counter when the underlying data source fails", () => {
  resetMetrics();
  const originalWrite = process.stderr.write;
  const lines: string[] = [];
  process.stderr.write = ((chunk: unknown) => {
    lines.push(String(chunk));
    return true;
  }) as typeof process.stderr.write;

  const failingStore: MenuStore = {
    getMenu: () => {
      throw new Error("data source unavailable");
    },
  };

  try {
    getMenuResponse(failingStore, "open-burger-shack");
  } finally {
    process.stderr.write = originalWrite;
  }

  assert.equal(lines.length, 1);
  const logged = JSON.parse(lines[0]);
  assert.equal(logged.level, "error");
  assert.equal(logged.restaurantId, "open-burger-shack");
  assert.equal(logged.error, "data source unavailable");
  assert.equal(getCounter("menu_fetch_failures_total"), 1);
});

test("GET /restaurants/:id/menu returns 200 with real menu data for a known restaurant id", async () => {
  const server = createServer();
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address();
  if (address === null || typeof address === "string") {
    throw new Error("expected server to bind to a port");
  }

  try {
    const response = await fetch(`http://127.0.0.1:${address.port}/restaurants/open-burger-shack/menu`);
    const body = (await response.json()) as { items: MenuItem[] };

    assert.equal(response.status, 200);
    assert.ok(body.items.length >= 2);
    for (const item of body.items) {
      assert.ok(item.name);
      assert.ok(item.description);
      assert.equal(typeof item.price, "number");
      assert.ok(item.customisationOptions.length >= 1);
    }
  } finally {
    server.close();
  }
});

test("GET /restaurants/:id/menu includes CORS headers so the web app can call it cross-origin", async () => {
  const server = createServer();
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address();
  if (address === null || typeof address === "string") {
    throw new Error("expected server to bind to a port");
  }

  try {
    const response = await fetch(`http://127.0.0.1:${address.port}/restaurants/open-burger-shack/menu`, {
      headers: { Origin: "http://localhost:3010" },
    });

    assert.equal(response.headers.get("access-control-allow-origin"), "*");
  } finally {
    server.close();
  }
});

test("GET /restaurants/:id/menu records RED metrics (request count and latency) labelled by route and status", async () => {
  resetMetrics();
  const server = createServer();
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address();
  if (address === null || typeof address === "string") {
    throw new Error("expected server to bind to a port");
  }

  try {
    await fetch(`http://127.0.0.1:${address.port}/restaurants/open-burger-shack/menu`);

    assert.equal(getCounter("http_requests_total", { route: "/restaurants/:id/menu", status: "200" }), 1);
    const { getDurations } = await import("../observability/metrics.ts");
    assert.equal(getDurations("http_request_duration_ms", { route: "/restaurants/:id/menu" }).length, 1);
  } finally {
    server.close();
  }
});

test("GET /restaurants/:id/menu logs a structured INFO entry including the request's trace id on success", async () => {
  const calls: Array<{ message: string; fields: Record<string, unknown> }> = [];
  const server = createServer({ logInfo: (message, fields = {}) => calls.push({ message, fields }) });
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address();
  if (address === null || typeof address === "string") {
    throw new Error("expected server to bind to a port");
  }

  try {
    await fetch(`http://127.0.0.1:${address.port}/restaurants/open-burger-shack/menu`, {
      headers: { "X-Trace-ID": "trace-abc-123" },
    });
  } finally {
    server.close();
  }

  assert.equal(calls.length, 1);
  assert.equal(calls[0].fields.traceId, "trace-abc-123");
  assert.equal(calls[0].fields.status, 200);
  assert.equal(calls[0].fields.restaurantId, "open-burger-shack");
});

test("responds to CORS preflight OPTIONS requests with allowed headers including X-Trace-ID", async () => {
  const server = createServer();
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address();
  if (address === null || typeof address === "string") {
    throw new Error("expected server to bind to a port");
  }

  try {
    const response = await fetch(`http://127.0.0.1:${address.port}/restaurants/open-burger-shack/menu`, {
      method: "OPTIONS",
    });

    assert.equal(response.headers.get("access-control-allow-origin"), "*");
    assert.ok(response.headers.get("access-control-allow-headers")?.includes("X-Trace-ID"));
  } finally {
    server.close();
  }
});

test("GET /restaurants/:id/menu returns 404 for an unknown restaurant id", async () => {
  const server = createServer();
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address();
  if (address === null || typeof address === "string") {
    throw new Error("expected server to bind to a port");
  }

  try {
    const response = await fetch(`http://127.0.0.1:${address.port}/restaurants/does-not-exist/menu`);
    assert.equal(response.status, 404);
  } finally {
    server.close();
  }
});
