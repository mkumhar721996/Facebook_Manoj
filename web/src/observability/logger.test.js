import { test } from "node:test";
import assert from "node:assert/strict";
import { logInfo, logError } from "./logger.js";

/**
 * @param {"log" | "error"} method
 * @param {() => void} fn
 */
function captureConsole(method, fn) {
  const original = console[method];
  const calls = [];
  console[method] = (...args) => calls.push(args);
  try {
    fn();
  } finally {
    console[method] = original;
  }
  return calls;
}

test("logError writes a structured JSON entry to console.error with the level, message, and fields", () => {
  const calls = captureConsole("error", () => {
    logError("failed to load menu", { restaurantId: "open-burger-shack", error: "boom" });
  });

  assert.equal(calls.length, 1);
  const parsed = JSON.parse(calls[0][0]);
  assert.equal(parsed.level, "error");
  assert.equal(parsed.message, "failed to load menu");
  assert.equal(parsed.restaurantId, "open-burger-shack");
  assert.equal(parsed.error, "boom");
});

test("logInfo writes a structured JSON entry to console.log with the level, message, and fields", () => {
  const calls = captureConsole("log", () => {
    logInfo("menu loaded", { restaurantId: "open-burger-shack" });
  });

  assert.equal(calls.length, 1);
  const parsed = JSON.parse(calls[0][0]);
  assert.equal(parsed.level, "info");
  assert.equal(parsed.message, "menu loaded");
  assert.equal(parsed.restaurantId, "open-burger-shack");
});
