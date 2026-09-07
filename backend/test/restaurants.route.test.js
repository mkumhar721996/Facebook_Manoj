import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "../src/server.js";

async function withServer(fn) {
  const server = createServer();
  await new Promise((resolve) => server.listen(0, resolve));
  const { port } = server.address();
  try {
    await fn(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

test("GET /api/restaurants returns 200 with restaurants including name, cuisineType, averageRating, estimatedDeliveryMinutes (AC1)", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/restaurants`);
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.ok(Array.isArray(body.restaurants));
    assert.ok(body.restaurants.length > 0);

    for (const restaurant of body.restaurants) {
      assert.equal(typeof restaurant.name, "string");
      assert.equal(typeof restaurant.cuisineType, "string");
      assert.ok(
        restaurant.averageRating === null ||
          typeof restaurant.averageRating === "number"
      );
      assert.equal(typeof restaurant.estimatedDeliveryMinutes, "number");
    }
  });
});

test("GET /api/restaurants includes at least one restaurant with a null averageRating to represent 'No ratings yet' (AC1)", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/restaurants`);
    const body = await response.json();

    const unrated = body.restaurants.find((r) => r.averageRating === null);
    assert.ok(unrated, "expected at least one unrated restaurant in seed data");
  });
});

test("GET /api/restaurants returns 200 with no Authorization header set (AC9)", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/restaurants`);
    assert.equal(response.status, 200);
  });
});

test("GET /api/restaurants?search= filters by name or cuisine substring (AC2)", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/restaurants?search=italian`);
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.ok(body.restaurants.length > 0);
    for (const restaurant of body.restaurants) {
      const term = "italian";
      assert.ok(
        restaurant.name.toLowerCase().includes(term) ||
          restaurant.cuisineType.toLowerCase().includes(term)
      );
    }
  });
});

test("GET /api/restaurants combines cuisine, minRating, and maxDeliveryMinutes filters (AC3)", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(
      `${baseUrl}/api/restaurants?cuisine=Chinese&minRating=4&maxDeliveryMinutes=35`
    );
    const body = await response.json();

    assert.equal(response.status, 200);
    for (const restaurant of body.restaurants) {
      assert.equal(restaurant.cuisineType, "Chinese");
      assert.ok(restaurant.averageRating >= 4);
      assert.ok(restaurant.estimatedDeliveryMinutes <= 35);
    }
  });
});
