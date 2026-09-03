import type { IncomingMessage, ServerResponse } from "node:http";
import type { Db } from "./db.ts";
import { handleRegister, handleLogin } from "./auth/routes.ts";
import { handleGetTasks } from "./tasks/routes.ts";

export type RequestListener = (req: IncomingMessage, res: ServerResponse) => void;

async function readJsonBody(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(chunk as Buffer);
  }
  if (chunks.length === 0) return {};
  const raw = Buffer.concat(chunks).toString("utf8").trim();
  if (!raw) return {};
  return JSON.parse(raw);
}

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  const payload = JSON.stringify(body);
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(payload);
}

const ALLOWED_ORIGIN = `http://localhost:${Number(process.env.ARC_WEB_PORT ?? 3001)}`;

export function createApp(db: Db): RequestListener {
  return (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");

    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }

    void (async () => {
      const url = new URL(req.url ?? "/", "http://localhost");

      try {
        if (req.method === "POST" && url.pathname === "/auth/register") {
          const result = handleRegister(db, await readJsonBody(req));
          sendJson(res, result.status, result.body);
          return;
        }

        if (req.method === "POST" && url.pathname === "/auth/login") {
          const result = handleLogin(db, await readJsonBody(req));
          sendJson(res, result.status, result.body);
          return;
        }

        if (req.method === "GET" && url.pathname === "/tasks") {
          const result = handleGetTasks(req.headers.authorization);
          sendJson(res, result.status, result.body);
          return;
        }

        sendJson(res, 404, { error: "Not found" });
      } catch (err) {
        if (err instanceof SyntaxError) {
          sendJson(res, 400, { error: "Invalid JSON body" });
          return;
        }
        sendJson(res, 500, { error: "Internal server error" });
      }
    })();
  };
}
