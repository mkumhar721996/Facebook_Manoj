import test from "node:test";
import assert from "node:assert/strict";
import { RatingSummary } from "./RatingSummary.ts";
import { renderToStaticMarkup, findAll, textContent } from "../../lib/dom/vnode.ts";

const INTERACTIVE_TAGS = ["button", "input", "textarea", "select", "form", "a"];
const SUBMIT_NAME_PATTERN = /rate|review|submit/i;

test("AC1: shows average and plural review count when ratings exist", () => {
  const tree = RatingSummary({ average: 4.5, count: 2 });
  const text = textContent(tree);
  assert.ok(text.includes("4.5"));
  assert.ok(text.includes("2 reviews"));
});

test("AC2: shows 'No ratings yet' when there are no ratings", () => {
  const tree = RatingSummary({ average: null, count: 0 });
  assert.equal(textContent(tree), "No ratings yet");
});

test("AC3: renders no interactive submission controls in either state", () => {
  for (const props of [{ average: 4.5, count: 2 }, { average: null, count: 0 }]) {
    const tree = RatingSummary(props);
    const interactive = findAll(tree, (node) => INTERACTIVE_TAGS.includes(node.tag));
    assert.equal(interactive.length, 0);
  }
});

test("edge case: singular wording for exactly one review", () => {
  const tree = RatingSummary({ average: 5, count: 1 });
  assert.ok(textContent(tree).includes("1 review"));
  assert.ok(!textContent(tree).includes("1 reviews"));
});

test("edge case: a legitimate score of 0 renders as a real rating, not 'No ratings yet'", () => {
  const tree = RatingSummary({ average: 0, count: 1 });
  const text = textContent(tree);
  assert.ok(text.includes("0"));
  assert.ok(text.includes("1 review"));
  assert.ok(!text.includes("No ratings yet"));
});

test("edge case: large review counts render in full without truncation", () => {
  const tree = RatingSummary({ average: 4.2, count: 12345 });
  assert.ok(textContent(tree).includes("12345"));
});

test("security: markup in no way affects rendering (no submission affordance ever present)", () => {
  const tree = RatingSummary({ average: 4.5, count: 2 });
  const namedInteractive = findAll(
    tree,
    (node) =>
      INTERACTIVE_TAGS.includes(node.tag) ||
      SUBMIT_NAME_PATTERN.test(node.props["aria-label"] ?? ""),
  );
  assert.equal(namedInteractive.length, 0);
});

test("security: static markup never contains an executable tag", () => {
  const tree = RatingSummary({ average: 4.5, count: 2 });
  const html = renderToStaticMarkup(tree);
  assert.ok(!/<script/i.test(html));
});
