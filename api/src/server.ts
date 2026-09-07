import http from "node:http";
import { getMenuResponse, type MenuStore } from "./routes/menu.ts";
import { getMenu } from "./data/menuStore.ts";
import { logInfo as defaultLogInfo, type LogFields } from "./observability/logger.ts";
import { incrementCounter, recordDuration } from "./observability/metrics.ts";

const menuStore: MenuStore = { getMenu };

const MENU_PATH_PATTERN = /^\/restaurants\/([^/]+)\/menu$/;
const MENU_ROUTE_LABEL = "/restaurants/:id/menu";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, X-Trace-ID",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

export interface CreateServerOptions {
  logInfo?: (message: string, fields?: LogFields) => void;
}

export function createServer(options: CreateServerOptions = {}): http.Server {
  const logInfo = options.logInfo ?? defaultLogInfo;

  return http.createServer((req, res) => {
    if (req.method === "OPTIONS") {
      res.writeHead(204, CORS_HEADERS);
      res.end();
      return;
    }

    const start = Date.now();
    const traceIdHeader = req.headers["x-trace-id"];
    const traceId = Array.isArray(traceIdHeader) ? traceIdHeader[0] : traceIdHeader;
    const url = new URL(req.url ?? "/", "http://localhost");
    const match = req.method === "GET" ? url.pathname.match(MENU_PATH_PATTERN) : null;

    if (!match) {
      res.writeHead(404, { "Content-Type": "application/json", ...CORS_HEADERS });
      res.end(JSON.stringify({ error: "Not found" }));
      return;
    }

    const restaurantId = decodeURIComponent(match[1]);
    const { status, body } = getMenuResponse(menuStore, restaurantId);
    res.writeHead(status, { "Content-Type": "application/json", ...CORS_HEADERS });
    res.end(JSON.stringify(body));

    incrementCounter("http_requests_total", { route: MENU_ROUTE_LABEL, status: String(status) });
    recordDuration("http_request_duration_ms", Date.now() - start, { route: MENU_ROUTE_LABEL });
    if (status < 400) {
      logInfo("menu request completed", { route: MENU_ROUTE_LABEL, status, restaurantId, traceId });
    }
  });
}

const isMain = process.argv[1] && import.meta.url === new URL(process.argv[1], "file:").href;
if (isMain) {
  const port = Number(process.env.ARC_DEV_PORT) || 8010;
  createServer().listen(port, () => {
    console.log(`API listening on port ${port}`);
  });
}
