import test from "node:test";
import assert from "node:assert/strict";
import { RestaurantListingItem } from "./RestaurantListingItem.ts";
import { renderToStaticMarkup, findAll, textContent } from "../../lib/dom/vnode.ts";

const INTERACTIVE_TAGS = ["button", "input", "textarea", "select", "form", "a"];
const SUBMIT_NAME_PATTERN = /rate|review|submit/i;

test("AC1: shows the restaurant name and its average/count when it has ratings", () => {
  const tree = RestaurantListingItem({
    name: "Pasta Place",
    ratings: [{ score: 4 }, { score: 5 }],
  });
  const text = textContent(tree);
  assert.ok(text.includes("Pasta Place"));
  assert.ok(text.includes("4.5"));
  assert.ok(text.includes("2 reviews"));
});

test("AC2: shows 'No ratings yet' when the restaurant has an empty ratings list", () => {
  const tree = RestaurantListingItem({ name: "New Spot", ratings: [] });
  assert.ok(textContent(tree).includes("No ratings yet"));
});

test("edge case: a missing (undefined) ratings field also shows 'No ratings yet' without throwing", () => {
  const tree = RestaurantListingItem({ name: "New Spot" });
  assert.ok(textContent(tree).includes("No ratings yet"));
});

test("AC3: never renders a submission/review control", async () => {
  const originalFetch = globalThis.fetch;
  let fetchCalls = 0;
  globalThis.fetch = (async (...args: Parameters<typeof fetch>) => {
    fetchCalls += 1;
    return originalFetch ? originalFetch(...args) : (undefined as unknown as Response);
  }) as typeof fetch;

  try {
    for (const restaurant of [
      { name: "Pasta Place", ratings: [{ score: 4 }] },
      { name: "New Spot", ratings: [] },
    ]) {
      const tree = RestaurantListingItem(restaurant);
      const interactive = findAll(
        tree,
        (node) =>
          INTERACTIVE_TAGS.includes(node.tag) ||
          SUBMIT_NAME_PATTERN.test(node.props["aria-label"] ?? ""),
      );
      assert.equal(interactive.length, 0);
    }
    assert.equal(fetchCalls, 0);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("security: a malicious restaurant name is rendered as literal escaped text, never HTML", () => {
  const tree = RestaurantListingItem({
    name: '<img src=x onerror=alert(1)>',
    ratings: [],
  });
  const html = renderToStaticMarkup(tree);
  assert.ok(!html.includes("<img"));
  assert.ok(html.includes("&lt;img"));
});
