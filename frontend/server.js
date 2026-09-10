import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = fileURLToPath(new URL(".", import.meta.url));
const publicDir = join(rootDir, "public");
const port = Number(process.env.ARC_WEB_PORT ?? 3001);
const backendPort = Number(process.env.ARC_DEV_PORT ?? 8001);

const CONTENT_TYPES = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
};

function resolveWithinBase(baseDir, requestPath) {
  const normalizedBase = resolve(baseDir);
  const resolved = resolve(normalizedBase, `.${requestPath}`);
  if (resolved !== normalizedBase && !resolved.startsWith(normalizedBase + sep)) {
    throw new Error("Path escapes base directory");
  }
  return resolved;
}

async function serveFile(res, filePath) {
  const contents = await readFile(filePath);
  const type = CONTENT_TYPES[extname(filePath)] ?? "application/octet-stream";
  res.writeHead(200, { "Content-Type": type });
  res.end(contents);
}

createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", "http://localhost");

  if (url.pathname === "/config.js") {
    res.writeHead(200, { "Content-Type": "text/javascript" });
    res.end(`export const BACKEND_BASE_URL = "http://localhost:${backendPort}";\n`);
    return;
  }

  try {
    if (url.pathname.startsWith("/src/")) {
      await serveFile(res, resolveWithinBase(rootDir, url.pathname));
      return;
    }

    if (!extname(url.pathname)) {
      await serveFile(res, join(publicDir, "index.html"));
      return;
    }

    await serveFile(res, resolveWithinBase(publicDir, url.pathname));
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not found");
  }
}).listen(port, () => {
  console.log(`Frontend listening on port ${port}`);
});
