import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createServer, resolveFilePath } from "../server.js";

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
