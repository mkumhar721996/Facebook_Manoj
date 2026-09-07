import { test } from "node:test";
import assert from "node:assert/strict";
import { incrementCounter, getCounter, resetMetrics } from "./metrics.js";

test("incrementCounter increments a named, labelled counter and getCounter reads it back", () => {
  resetMetrics();

  incrementCounter("menu_load_failures_total", { restaurantId: "open-burger-shack" });
  incrementCounter("menu_load_failures_total", { restaurantId: "open-burger-shack" });
  incrementCounter("menu_load_failures_total", { restaurantId: "other" });

  assert.equal(getCounter("menu_load_failures_total", { restaurantId: "open-burger-shack" }), 2);
  assert.equal(getCounter("menu_load_failures_total", { restaurantId: "other" }), 1);
  assert.equal(getCounter("menu_load_failures_total", { restaurantId: "unseen" }), 0);
});
