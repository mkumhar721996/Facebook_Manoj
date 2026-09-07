import { test } from "node:test";
import assert from "node:assert/strict";
import { logInfo, logError } from "./logger.ts";

function captureStream(stream: NodeJS.WritableStream, fn: () => void): string[] {
  const original = stream.write.bind(stream);
  const lines: string[] = [];
  stream.write = ((chunk: unknown) => {
    lines.push(String(chunk));
    return true;
  }) as typeof stream.write;

  try {
    fn();
  } finally {
    stream.write = original;
  }

  return lines;
}

test("logError writes a structured JSON line to stderr with the level, message, and fields", () => {
  const lines = captureStream(process.stderr, () => {
    logError("failed to load menu", { restaurantId: "open-burger-shack", error: "boom" });
  });

  assert.equal(lines.length, 1);
  const parsed = JSON.parse(lines[0]);
  assert.equal(parsed.level, "error");
  assert.equal(parsed.message, "failed to load menu");
  assert.equal(parsed.restaurantId, "open-burger-shack");
  assert.equal(parsed.error, "boom");
  assert.ok(parsed.timestamp);
});

test("logInfo writes a structured JSON line to stdout with the level, message, and fields", () => {
  const lines = captureStream(process.stdout, () => {
    logInfo("menu request completed", { route: "/restaurants/:id/menu", status: 200 });
  });

  assert.equal(lines.length, 1);
  const parsed = JSON.parse(lines[0]);
  assert.equal(parsed.level, "info");
  assert.equal(parsed.message, "menu request completed");
  assert.equal(parsed.route, "/restaurants/:id/menu");
  assert.equal(parsed.status, 200);
});
