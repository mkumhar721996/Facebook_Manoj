import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function parsePort(value, fallback) {
  const port = Number(value);
  if (value === undefined || !Number.isInteger(port) || port < 0 || port > 65535) {
    return fallback;
  }
  return port;
}

const webPort = parsePort(process.env.ARC_WEB_PORT, 3008);
const backendPort = parsePort(process.env.ARC_DEV_PORT, 8008);
const backendBaseUrl = `http://localhost:${backendPort}`;

const contentTypes = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".css": "text/css",
};

const SRC_ROOT = path.join(__dirname, "src");

export function resolveFilePath(pathname) {
  if (pathname === "/" || pathname === "/index.html") {
    return path.join(__dirname, "public", "index.html");
  }
  if (!pathname.startsWith("/src/")) {
    return null;
  }

  const relative = pathname.slice("/src/".length);
  const resolved = path.resolve(SRC_ROOT, relative);
  if (resolved !== SRC_ROOT && !resolved.startsWith(SRC_ROOT + path.sep)) {
    return null;
  }
  return resolved;
}

export function createServer({
  logger = console,
  statImpl = fs.statSync,
  readFileImpl = fs.readFileSync,
} = {}) {
  return http.createServer((req, res) => {
    const url = new URL(req.url, "http://localhost");
    const filePath = resolveFilePath(url.pathname);

    let stat;
    try {
      stat = filePath ? statImpl(filePath) : null;
    } catch (error) {
      if (error.code === "ENOENT") {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("Not found");
        return;
      }
      logger.error({ event: "static_file_stat_failed", path: url.pathname, error: error.message });
      res.writeHead(500, { "Content-Type": "text/plain" });
      res.end("Internal server error");
      return;
    }

    if (!filePath || !stat || !stat.isFile()) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("Not found");
      return;
    }

    let contents;
    try {
      contents = readFileImpl(filePath, "utf-8");
    } catch (error) {
      logger.error({ event: "static_file_read_failed", path: url.pathname, error: error.message });
      res.writeHead(500, { "Content-Type": "text/plain" });
      res.end("Internal server error");
      return;
    }

    if (filePath.endsWith("index.html")) {
      contents = contents.replace("%%BACKEND_BASE_URL%%", JSON.stringify(backendBaseUrl));
    }

    const ext = path.extname(filePath);
    res.writeHead(200, { "Content-Type": contentTypes[ext] || "text/plain" });
    res.end(contents);
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const server = createServer();
  server.listen(webPort, () => {
    console.log(`Frontend listening on port ${webPort}`);
  });
}
