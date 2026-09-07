import test from "node:test";
import assert from "node:assert/strict";
import { renderApp } from "../src/render.js";
import { createInitialState, reduce } from "../src/state.js";

test("renders name, cuisine type, rating, and delivery time for each restaurant (AC1)", () => {
  const state = reduce(createInitialState(), {
    type: "FETCH_SUCCESS",
    restaurants: [
      { id: "1", name: "Golden Dragon", cuisineType: "Chinese", averageRating: 4.5, estimatedDeliveryMinutes: 30 },
    ],
  });

  const html = renderApp(state);

  assert.match(html, /Golden Dragon/);
  assert.match(html, /Chinese/);
  assert.match(html, /4\.5/);
  assert.match(html, /30/);
});

test("shows 'No ratings yet' when averageRating is null (AC1)", () => {
  const state = reduce(createInitialState(), {
    type: "FETCH_SUCCESS",
    restaurants: [
      { id: "3", name: "Taco Fiesta", cuisineType: "Mexican", averageRating: null, estimatedDeliveryMinutes: 25 },
    ],
  });

  const html = renderApp(state);
  assert.match(html, /No ratings yet/);
});

test("shows a loading indicator while status is loading (AC7)", () => {
  const state = reduce(createInitialState(), { type: "FETCH_START" });
  const html = renderApp(state);
  assert.match(html, /data-testid="loading-indicator"/);
});

test("does not show the loading indicator once results have loaded (AC7)", () => {
  const state = reduce(createInitialState(), { type: "FETCH_SUCCESS", restaurants: [] });
  const html = renderApp(state);
  assert.doesNotMatch(html, /data-testid="loading-indicator"/);
});

test("shows 'No results found' and a clear-filters prompt when there are no matching restaurants (AC5)", () => {
  const state = reduce(createInitialState({ search: "nonexistent" }), {
    type: "FETCH_SUCCESS",
    restaurants: [],
  });

  const html = renderApp(state);
  assert.match(html, /No results found/);
  assert.match(html, /data-action="clear-filters"/);
});

test("shows a generic error message with a retry action when the fetch fails (AC8)", () => {
  const state = reduce(createInitialState(), { type: "FETCH_ERROR" });
  const html = renderApp(state);

  assert.match(html, /Something went wrong/);
  assert.doesNotMatch(html, /No results found/);
  assert.match(html, /data-action="retry"/);
});
