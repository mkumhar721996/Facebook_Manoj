import test from "node:test";
import assert from "node:assert/strict";
import { FIELD_BINDINGS, parseNullableNumber } from "../src/fieldBindings.js";

test("search-input and cuisine-filter both bind on 'input' so typing updates live, matching UX (code review finding)", () => {
  const search = FIELD_BINDINGS.find((b) => b.testId === "search-input");
  const cuisine = FIELD_BINDINGS.find((b) => b.testId === "cuisine-filter");

  assert.equal(search.event, "input");
  assert.equal(cuisine.event, "input");
});

test("numeric filters (minRating, maxDeliveryMinutes) bind on 'change'", () => {
  const minRating = FIELD_BINDINGS.find((b) => b.testId === "min-rating-filter");
  const maxDelivery = FIELD_BINDINGS.find((b) => b.testId === "max-delivery-filter");

  assert.equal(minRating.event, "change");
  assert.equal(maxDelivery.event, "change");
});

test("each binding maps to a controller action name", () => {
  assert.deepEqual(
    FIELD_BINDINGS.map((b) => b.action).sort(),
    ["setCuisine", "setMaxDeliveryMinutes", "setMinRating", "setSearch"]
  );
});

test("parseNullableNumber converts an empty string to null and numeric strings to numbers", () => {
  assert.equal(parseNullableNumber(""), null);
  assert.equal(parseNullableNumber("4"), 4);
});
