import { test } from "node:test";
import assert from "node:assert/strict";
import { incrementCounter, getCounter, recordDuration, getDurations, resetMetrics } from "./metrics.ts";

test("incrementCounter increments a named, labelled counter and getCounter reads it back", () => {
  resetMetrics();

  incrementCounter("menu_fetch_failures_total", { restaurantId: "open-burger-shack" });
  incrementCounter("menu_fetch_failures_total", { restaurantId: "open-burger-shack" });
  incrementCounter("menu_fetch_failures_total", { restaurantId: "other" });

  assert.equal(getCounter("menu_fetch_failures_total", { restaurantId: "open-burger-shack" }), 2);
  assert.equal(getCounter("menu_fetch_failures_total", { restaurantId: "other" }), 1);
  assert.equal(getCounter("menu_fetch_failures_total", { restaurantId: "unseen" }), 0);
});

test("recordDuration records a duration sample per labelled metric name", () => {
  resetMetrics();

  recordDuration("http_request_duration_ms", 12, { route: "/restaurants/:id/menu" });
  recordDuration("http_request_duration_ms", 34, { route: "/restaurants/:id/menu" });

  assert.deepEqual(getDurations("http_request_duration_ms", { route: "/restaurants/:id/menu" }), [12, 34]);
});
