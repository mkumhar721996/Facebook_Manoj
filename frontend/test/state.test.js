import test from "node:test";
import assert from "node:assert/strict";
import { createInitialState, reduce } from "../src/state.js";

test("createInitialState defaults to idle status with empty filters (AC1)", () => {
  const state = createInitialState();
  assert.equal(state.status, "idle");
  assert.equal(state.search, "");
  assert.equal(state.cuisine, "");
  assert.equal(state.minRating, null);
  assert.equal(state.maxDeliveryMinutes, null);
  assert.deepEqual(state.restaurants, []);
});

test("createInitialState accepts overrides parsed from the URL (AC4)", () => {
  const state = createInitialState({ search: "pizza", cuisine: "Italian", minRating: 4, maxDeliveryMinutes: 30 });
  assert.equal(state.search, "pizza");
  assert.equal(state.cuisine, "Italian");
  assert.equal(state.minRating, 4);
  assert.equal(state.maxDeliveryMinutes, 30);
});

test("SET_SEARCH updates the search term (AC2)", () => {
  const state = reduce(createInitialState(), { type: "SET_SEARCH", value: "tacos" });
  assert.equal(state.search, "tacos");
});

test("SET_CUISINE, SET_MIN_RATING, and SET_MAX_DELIVERY combine with the existing search term (AC3)", () => {
  let state = createInitialState({ search: "tacos" });
  state = reduce(state, { type: "SET_CUISINE", value: "Mexican" });
  state = reduce(state, { type: "SET_MIN_RATING", value: 4 });
  state = reduce(state, { type: "SET_MAX_DELIVERY", value: 25 });

  assert.equal(state.search, "tacos");
  assert.equal(state.cuisine, "Mexican");
  assert.equal(state.minRating, 4);
  assert.equal(state.maxDeliveryMinutes, 25);
});

test("CLEAR_FILTERS resets search and all filters back to defaults (AC6)", () => {
  let state = createInitialState({ search: "tacos", cuisine: "Mexican", minRating: 4, maxDeliveryMinutes: 25 });
  state = reduce(state, { type: "CLEAR_FILTERS" });

  assert.equal(state.search, "");
  assert.equal(state.cuisine, "");
  assert.equal(state.minRating, null);
  assert.equal(state.maxDeliveryMinutes, null);
});

test("FETCH_START sets status to loading (AC7)", () => {
  const state = reduce(createInitialState(), { type: "FETCH_START" });
  assert.equal(state.status, "loading");
});

test("FETCH_SUCCESS sets status to success and stores the restaurants (AC1)", () => {
  const restaurants = [{ id: "1", name: "Golden Dragon" }];
  const state = reduce(createInitialState(), { type: "FETCH_SUCCESS", restaurants });
  assert.equal(state.status, "success");
  assert.deepEqual(state.restaurants, restaurants);
});

test("FETCH_ERROR sets status to error (AC8)", () => {
  const state = reduce(createInitialState(), { type: "FETCH_ERROR" });
  assert.equal(state.status, "error");
});
