import test from "node:test";
import assert from "node:assert/strict";
import { fetchRestaurants } from "../src/api.js";

test("requests /api/restaurants with search/cuisine/minRating/maxDeliveryMinutes as query params (AC2, AC3)", async () => {
  let capturedUrl;
  const fakeFetch = async (url) => {
    capturedUrl = url;
    return {
      ok: true,
      json: async () => ({ restaurants: [] }),
    };
  };

  await fetchRestaurants(
    { search: "tacos", cuisine: "Mexican", minRating: 4, maxDeliveryMinutes: 25 },
    { fetchImpl: fakeFetch, baseUrl: "http://localhost:8008" }
  );

  const url = new URL(capturedUrl);
  assert.equal(url.pathname, "/api/restaurants");
  assert.equal(url.searchParams.get("search"), "tacos");
  assert.equal(url.searchParams.get("cuisine"), "Mexican");
  assert.equal(url.searchParams.get("minRating"), "4");
  assert.equal(url.searchParams.get("maxDeliveryMinutes"), "25");
});

test("does not send an Authorization header, so the request works without authentication (AC9)", async () => {
  let capturedInit;
  const fakeFetch = async (url, init) => {
    capturedInit = init;
    return { ok: true, json: async () => ({ restaurants: [] }) };
  };

  await fetchRestaurants({}, { fetchImpl: fakeFetch, baseUrl: "http://localhost:8008" });

  const headers = (capturedInit && capturedInit.headers) || {};
  assert.equal(Object.keys(headers).includes("Authorization"), false);
});

test("returns the restaurants array on a successful response (AC1)", async () => {
  const fakeFetch = async () => ({
    ok: true,
    json: async () => ({ restaurants: [{ id: "1", name: "Golden Dragon" }] }),
  });

  const result = await fetchRestaurants({}, { fetchImpl: fakeFetch, baseUrl: "http://localhost:8008" });
  assert.deepEqual(result, [{ id: "1", name: "Golden Dragon" }]);
});

test("throws when the backend responds with a non-ok status (AC8)", async () => {
  const fakeFetch = async () => ({ ok: false, status: 500, json: async () => ({}) });

  await assert.rejects(() =>
    fetchRestaurants({}, { fetchImpl: fakeFetch, baseUrl: "http://localhost:8008" })
  );
});
