import { createServer, type Server } from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { handleSignup, handleLogin, handleVerify, handleMe } from "./routes/auth.ts";
import type { AccountService } from "./services/accountService.ts";
import type { InMemorySessionStore } from "./session/sessionStore.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.resolve(__dirname, "../web/public");
const CLIENT_SRC_DIR = path.resolve(__dirname, "../web/src");
const SHARED_DIR = path.resolve(__dirname, "../shared");
const DESIGN_DIR = path.resolve(__dirname, "../../docs/design");

export type AppDeps = {
  accountService: AccountService;
  sessionStore: InMemorySessionStore;
};

const CONTENT_TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
};

async function serveStaticFile(res: import("node:http").ServerResponse, filePath: string): Promise<boolean> {
  try {
    const contents = await readFile(filePath);
    const ext = path.extname(filePath);
    res.writeHead(200, { "content-type": CONTENT_TYPES[ext] ?? "application/octet-stream" });
    res.end(contents);
    return true;
  } catch {
    return false;
  }
}

export function createApp(deps: AppDeps): Server {
  return createServer(async (req, res) => {
    try {
      const url = new URL(req.url ?? "/", "http://localhost");

      if (req.method === "POST" && url.pathname === "/api/signup") {
        await handleSignup(req, res, deps);
        return;
      }

      if (req.method === "POST" && url.pathname === "/api/login") {
        await handleLogin(req, res, deps);
        return;
      }

      if (req.method === "GET" && url.pathname === "/api/verify") {
        await handleVerify(req, res, deps, url.searchParams.get("token") ?? "");
        return;
      }

      if (req.method === "GET" && url.pathname === "/api/me") {
        await handleMe(req, res, deps);
        return;
      }

      if (req.method === "GET") {
        const pathname = url.pathname === "/" ? "/signup.html" : url.pathname;

        if (pathname.startsWith("/src/")) {
          const clientMatch = await serveStaticFile(
            res,
            path.join(CLIENT_SRC_DIR, pathname.slice("/src/".length)),
          );
          if (clientMatch) return;
        } else if (pathname.startsWith("/shared/")) {
          const sharedMatch = await serveStaticFile(
            res,
            path.join(SHARED_DIR, pathname.slice("/shared/".length)),
          );
          if (sharedMatch) return;
        } else if (pathname.startsWith("/design/")) {
          const designMatch = await serveStaticFile(
            res,
            path.join(DESIGN_DIR, pathname.slice("/design/".length)),
          );
          if (designMatch) return;
        } else {
          const publicMatch = await serveStaticFile(res, path.join(PUBLIC_DIR, pathname));
          if (publicMatch) return;
        }
      }

      res.writeHead(404, { "content-type": "application/json" });
      res.end(JSON.stringify({ message: "Not found." }));
    } catch {
      res.writeHead(500, { "content-type": "application/json" });
      res.end(JSON.stringify({ message: "Internal server error." }));
    }
  });
}
