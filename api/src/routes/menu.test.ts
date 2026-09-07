import { test } from "node:test";
import assert from "node:assert/strict";
import { getMenuResponse, type MenuStore } from "./menu.ts";
import type { MenuItem } from "../data/menuStore.ts";
import { createServer } from "../server.ts";

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
