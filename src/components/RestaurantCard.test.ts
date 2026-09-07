import { test } from "node:test";
import assert from "node:assert/strict";
import { renderRestaurantCard } from "./RestaurantCard.ts";
import type { Restaurant } from "../types/restaurant.ts";

function makeRestaurant(overrides: Partial<Restaurant>): Restaurant {
  return {
    id: "r1",
    name: "Burger Barn",
    cuisine: "Burgers",
    status: "open",
    ...overrides,
  };
}

test("AC1: a closed restaurant is labelled 'Closed' and visually distinct", () => {
  const html = renderRestaurantCard(makeRestaurant({ status: "closed" }));

  assert.match(html, /closed/i);
  assert.match(html, /restaurant-card--closed/);
});

test("AC1: a paused restaurant is labelled as temporarily unavailable and visually distinct", () => {
  const html = renderRestaurantCard(makeRestaurant({ status: "paused" }));

  assert.match(html, /temporarily unavailable/i);
  assert.match(html, /restaurant-card--closed/);
});

test("AC1: an open restaurant carries no closed label or closed styling", () => {
  const html = renderRestaurantCard(makeRestaurant({ status: "open" }));

  assert.doesNotMatch(html, /closed/i);
  assert.doesNotMatch(html, /temporarily unavailable/i);
  assert.doesNotMatch(html, /restaurant-card--closed/);
});

test("AC2: a closed restaurant has no order-initiating affordance", () => {
  const html = renderRestaurantCard(makeRestaurant({ status: "closed" }));

  assert.doesNotMatch(html, /<button/i);
  assert.doesNotMatch(html, /<a\s/i);
});

test("AC2: a paused restaurant has no order-initiating affordance", () => {
  const html = renderRestaurantCard(makeRestaurant({ status: "paused" }));

  assert.doesNotMatch(html, /<button/i);
  assert.doesNotMatch(html, /<a\s/i);
});

test("AC2: an open restaurant retains its order affordance", () => {
  const html = renderRestaurantCard(makeRestaurant({ status: "open" }));

  assert.match(html, /<button[^>]*>[^<]*order[^<]*<\/button>/i);
});

test("security: restaurant name is HTML-escaped to prevent XSS", () => {
  const html = renderRestaurantCard(
    makeRestaurant({ name: `<img src=x onerror="alert('xss')">` })
  );

  assert.doesNotMatch(html, /<img/i);
  assert.match(html, /&lt;img/);
});

test("security: restaurant cuisine is HTML-escaped to prevent XSS", () => {
  const html = renderRestaurantCard(
    makeRestaurant({ cuisine: `<script>alert('xss')</script>` })
  );

  assert.doesNotMatch(html, /<script>/i);
  assert.match(html, /&lt;script&gt;/);
});
