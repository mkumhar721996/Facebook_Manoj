import test from "node:test";
import assert from "node:assert/strict";
import { listRestaurants } from "../src/services/restaurantService.js";

const sample = [
  { id: "1", name: "Golden Dragon", cuisineType: "Chinese", averageRating: 4.5, estimatedDeliveryMinutes: 30 },
  { id: "2", name: "Bella Italia", cuisineType: "Italian", averageRating: 4.2, estimatedDeliveryMinutes: 40 },
  { id: "3", name: "Taco Fiesta", cuisineType: "Mexican", averageRating: null, estimatedDeliveryMinutes: 25 },
  { id: "4", name: "Spice Route", cuisineType: "Indian", averageRating: 4.8, estimatedDeliveryMinutes: 45 },
  { id: "5", name: "Dragon Wok", cuisineType: "Chinese", averageRating: 3.0, estimatedDeliveryMinutes: 50 },
];

test("search matches restaurant name case-insensitively (AC2)", () => {
  const result = listRestaurants(sample, { search: "dragon" });
  assert.deepEqual(
    result.map((r) => r.id).sort(),
    ["1", "5"]
  );
});

test("search matches cuisineType case-insensitively (AC2)", () => {
  const result = listRestaurants(sample, { search: "italian" });
  assert.deepEqual(result.map((r) => r.id), ["2"]);
});

test("cuisine filter restricts to an exact cuisine type (AC3)", () => {
  const result = listRestaurants(sample, { cuisine: "Chinese" });
  assert.deepEqual(
    result.map((r) => r.id).sort(),
    ["1", "5"]
  );
});

test("minRating filter excludes restaurants below the minimum and excludes unrated restaurants (AC3)", () => {
  const result = listRestaurants(sample, { minRating: 4 });
  assert.deepEqual(
    result.map((r) => r.id).sort(),
    ["1", "2", "4"]
  );
});

test("maxDeliveryMinutes filter excludes restaurants slower than the maximum (AC3)", () => {
  const result = listRestaurants(sample, { maxDeliveryMinutes: 30 });
  assert.deepEqual(
    result.map((r) => r.id).sort(),
    ["1", "3"]
  );
});

test("search, cuisine, minRating, and maxDeliveryMinutes are AND-combined (AC3)", () => {
  const result = listRestaurants(sample, {
    search: "dragon",
    cuisine: "Chinese",
    minRating: 4,
    maxDeliveryMinutes: 35,
  });
  assert.deepEqual(result.map((r) => r.id), ["1"]);
});

test("returns all restaurants when no filters are supplied (AC1)", () => {
  const result = listRestaurants(sample, {});
  assert.equal(result.length, sample.length);
});
