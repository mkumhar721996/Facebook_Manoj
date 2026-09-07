import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createServer, resolveFilePath, parsePort } from "../server.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendRoot = path.dirname(__dirname);

async function withServer(fn) {
  const server = createServer();
  await new Promise((resolve) => server.listen(0, resolve));
  const { port } = server.address();
  try {
    await fn(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

test("serves an existing file under /src/ (sanity check)", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/src/main.js`);
    assert.equal(response.status, 200);
  });
});

test("rejects path traversal attempts escaping the src directory (security fix)", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/src/../../../../../etc/passwd`);
    assert.equal(response.status, 404);
  });
});

test("rejects percent-encoded path traversal attempts", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(
      `${baseUrl}/src/%2e%2e/%2e%2e/%2e%2e/%2e%2e/etc/passwd`
    );
    assert.equal(response.status, 404);
  });
});

test("rejects traversal that targets sibling project files like backend package.json", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/src/../../backend/package.json`);
    assert.equal(response.status, 404);
  });
});

test("returns 404 instead of crashing when a directory path is requested (security fix, frontend/server.js:46)", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/src/`);
    assert.equal(response.status, 404);
  });
});

test("resolveFilePath never returns a path outside the frontend directory, even given an already-traversed pathname (security fix, frontend/server.js:22)", () => {
  const escapePayload = "/src/" + "../".repeat(6) + "etc/passwd";
  const resolved = resolveFilePath(escapePayload);

  if (resolved !== null) {
    const relative = path.relative(frontendRoot, resolved);
    assert.ok(
      !relative.startsWith("..") && !path.isAbsolute(relative),
      `resolved path ${resolved} escaped frontend root ${frontendRoot}`
    );
  }
});

test("parsePort rejects non-numeric and out-of-range values, falling back to the default (security fix: template injection via env var)", () => {
  assert.equal(parsePort(undefined, 3008), 3008);
  assert.equal(parsePort("8008", 3008), 8008);
  assert.equal(parsePort('"; alert(document.cookie); //', 3008), 3008);
  assert.equal(parsePort("-1", 3008), 3008);
  assert.equal(parsePort("70000", 3008), 3008);
  assert.equal(parsePort("8008.5", 3008), 3008);
});

test("index.html embeds the backend base URL as a JSON-escaped string, not a raw interpolation (security fix: template injection via env var)", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/`);
    const body = await response.text();

    assert.match(body, /window\.__BACKEND_BASE_URL__ = "http:\/\/localhost:\d+";/);
  });
});

test("returns 500 and logs when statting a file throws an unexpected error (observability fix, frontend/server.js)", async () => {
  const loggedErrors = [];
  const logger = { error: (entry) => loggedErrors.push(entry) };
  const server = createServer({
    logger,
    statImpl: () => {
      throw Object.assign(new Error("permission denied"), { code: "EACCES" });
    },
  });
  await new Promise((resolve) => server.listen(0, resolve));
  const { port } = server.address();

  try {
    const response = await fetch(`http://127.0.0.1:${port}/src/main.js`);
    assert.equal(response.status, 500);
    assert.equal(loggedErrors.length, 1);
    assert.equal(loggedErrors[0].event, "static_file_stat_failed");
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test("returns 500 and logs when reading a file throws an unexpected error (observability fix, frontend/server.js)", async () => {
  const loggedErrors = [];
  const logger = { error: (entry) => loggedErrors.push(entry) };
  const server = createServer({
    logger,
    readFileImpl: () => {
      throw new Error("disk read failure");
    },
  });
  await new Promise((resolve) => server.listen(0, resolve));
  const { port } = server.address();

  try {
    const response = await fetch(`http://127.0.0.1:${port}/src/main.js`);
    assert.equal(response.status, 500);
    assert.equal(loggedErrors.length, 1);
    assert.equal(loggedErrors[0].event, "static_file_read_failed");
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
