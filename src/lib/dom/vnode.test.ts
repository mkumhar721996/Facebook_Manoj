import test from "node:test";
import assert from "node:assert/strict";
import { h, renderToStaticMarkup, findAll, textContent } from "./vnode.ts";

test("renders a simple element with text content", () => {
  const tree = h("p", {}, ["hello"]);
  assert.equal(renderToStaticMarkup(tree), "<p>hello</p>");
});

test("security: text content is always HTML-escaped, never interpreted as markup", () => {
  const tree = h("span", {}, ['<img src="x" onerror="alert(1)">']);
  const html = renderToStaticMarkup(tree);
  assert.ok(!html.includes("<img"), "raw <img> tag must not appear in output");
  assert.ok(html.includes("&lt;img"), "markup must be rendered as escaped text");
});

test("findAll locates nodes by predicate across nested children", () => {
  const tree = h("div", {}, [h("p", {}, ["a"]), h("button", {}, ["click"])]);
  const buttons = findAll(tree, (node) => node.tag === "button");
  assert.equal(buttons.length, 1);
});

test("textContent concatenates all nested text", () => {
  const tree = h("div", {}, [h("span", {}, ["4.5 "]), h("span", {}, ["(2 reviews)"])]);
  assert.equal(textContent(tree), "4.5 (2 reviews)");
});
