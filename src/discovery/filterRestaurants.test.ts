import { test } from "node:test";
import assert from "node:assert/strict";
import { filterRestaurants } from "./filterRestaurants.ts";
import type { Restaurant } from "../types/restaurant.ts";

const restaurants: Restaurant[] = [
  { id: "r1", name: "Burger Barn", cuisine: "Burgers", status: "open" },
  { id: "r2", name: "Patty Palace", cuisine: "Burgers", status: "closed" },
  { id: "r3", name: "Sushi Spot", cuisine: "Sushi", status: "open" },
];

test("AC3: a closed restaurant matching the filter criteria remains in the results", () => {
  const results = filterRestaurants(restaurants, { cuisine: "Burgers" });

  assert.equal(results.length, 2);
  assert.ok(results.some((r) => r.id === "r1"));
  assert.ok(results.some((r) => r.id === "r2"));
});

test("AC3: a closed restaurant's status is retained unchanged after filtering", () => {
  const results = filterRestaurants(restaurants, { cuisine: "Burgers" });

  const closed = results.find((r) => r.id === "r2");
  assert.equal(closed?.status, "closed");
});

test("AC3: a restaurant not matching the filter criteria is excluded regardless of status", () => {
  const results = filterRestaurants(restaurants, { cuisine: "Sushi" });

  assert.equal(results.length, 1);
  assert.equal(results[0].id, "r3");
});
