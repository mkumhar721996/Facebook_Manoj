import test from "node:test";
import assert from "node:assert/strict";
import { parseFiltersFromSearch, buildSearchString } from "../src/urlState.js";

test("parseFiltersFromSearch reads search/cuisine/minRating/maxDeliveryMinutes from a URL query string (AC4)", () => {
  const filters = parseFiltersFromSearch(
    "?search=pizza&cuisine=Italian&minRating=4&maxDeliveryMinutes=30"
  );

  assert.deepEqual(filters, {
    search: "pizza",
    cuisine: "Italian",
    minRating: 4,
    maxDeliveryMinutes: 30,
  });
});

test("parseFiltersFromSearch returns defaults when the query string is empty (AC4)", () => {
  const filters = parseFiltersFromSearch("");

  assert.deepEqual(filters, {
    search: "",
    cuisine: "",
    minRating: null,
    maxDeliveryMinutes: null,
  });
});

test("buildSearchString serializes active filters into a query string (AC4)", () => {
  const search = buildSearchString({
    search: "pizza",
    cuisine: "Italian",
    minRating: 4,
    maxDeliveryMinutes: 30,
  });

  const params = new URLSearchParams(search);
  assert.equal(params.get("search"), "pizza");
  assert.equal(params.get("cuisine"), "Italian");
  assert.equal(params.get("minRating"), "4");
  assert.equal(params.get("maxDeliveryMinutes"), "30");
});

test("buildSearchString omits empty/null filters so cleared filters are removed from the URL (AC6)", () => {
  const search = buildSearchString({
    search: "",
    cuisine: "",
    minRating: null,
    maxDeliveryMinutes: null,
  });

  assert.equal(search, "");
});

test("parseFiltersFromSearch and buildSearchString round-trip (AC4)", () => {
  const original = "?search=tacos&cuisine=Mexican&minRating=3&maxDeliveryMinutes=25";
  const filters = parseFiltersFromSearch(original);
  const rebuilt = buildSearchString(filters);

  assert.deepEqual(parseFiltersFromSearch(rebuilt), filters);
});
