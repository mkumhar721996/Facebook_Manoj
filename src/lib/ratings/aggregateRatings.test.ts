import test from "node:test";
import assert from "node:assert/strict";
import { aggregateRatings } from "./aggregateRatings.ts";

test("AC1: computes rounded average and count for multiple ratings", () => {
  const result = aggregateRatings([{ score: 4 }, { score: 5 }]);
  assert.deepEqual(result, { average: 4.5, count: 2 });
});

test("AC1: rounds average to one decimal place", () => {
  const result = aggregateRatings([{ score: 4 }, { score: 4 }, { score: 5 }]);
  assert.equal(result.count, 3);
  assert.equal(result.average, 4.3);
});

test("AC2: empty ratings list yields null average and zero count", () => {
  const result = aggregateRatings([]);
  assert.deepEqual(result, { average: null, count: 0 });
});

test("AC2: undefined ratings yields null average and zero count", () => {
  const result = aggregateRatings(undefined);
  assert.deepEqual(result, { average: null, count: 0 });
});

test("edge case: a score of 0 is a real rating, not the empty state", () => {
  const result = aggregateRatings([{ score: 0 }]);
  assert.deepEqual(result, { average: 0, count: 1 });
});

test("edge case: single rating average equals that score exactly", () => {
  const result = aggregateRatings([{ score: 3.7 }]);
  assert.deepEqual(result, { average: 3.7, count: 1 });
});

test("edge case: rounding boundary rounds half up to one decimal place", () => {
  // true average is 4.25 -> rounds to 4.3 (round-half-up, not banker's rounding)
  const result = aggregateRatings([{ score: 4 }, { score: 4 }, { score: 4 }, { score: 5 }]);
  assert.equal(result.average, 4.3);
});

test("security: ignores non-numeric score values without throwing", () => {
  const result = aggregateRatings([
    { score: 5 },
    // @ts-expect-error deliberately malformed input for a security test
    { score: "abc" },
  ]);
  assert.deepEqual(result, { average: 5, count: 1 });
});

test("security: ignores NaN and Infinity scores without throwing", () => {
  const result = aggregateRatings([
    { score: 5 },
    { score: NaN },
    { score: Infinity },
    { score: -Infinity },
  ]);
  assert.deepEqual(result, { average: 5, count: 1 });
});

test("security: ignores null/undefined score entries without throwing", () => {
  const result = aggregateRatings([
    { score: 5 },
    // @ts-expect-error deliberately malformed input for a security test
    { score: null },
    // @ts-expect-error deliberately malformed input for a security test
    {},
  ]);
  assert.deepEqual(result, { average: 5, count: 1 });
});

test("security: a __proto__-shaped record does not pollute Object.prototype", () => {
  const malicious = JSON.parse('[{"score": 5, "__proto__": {"polluted": true}}]');
  const result = aggregateRatings(malicious);
  assert.deepEqual(result, { average: 5, count: 1 });
  assert.equal((Object.prototype as Record<string, unknown>).polluted, undefined);
});

test("security: aggregates a very large input without throwing or timing out", () => {
  const large = Array.from({ length: 100_000 }, () => ({ score: 4 }));
  const result = aggregateRatings(large);
  assert.deepEqual(result, { average: 4, count: 100_000 });
});
