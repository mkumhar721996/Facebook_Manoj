import http from "node:http";
import { getMenuResponse, type MenuStore } from "./routes/menu.ts";
import { getMenu } from "./data/menuStore.ts";

const menuStore: MenuStore = { getMenu };

const MENU_PATH_PATTERN = /^\/restaurants\/([^/]+)\/menu$/;

export function createServer(): http.Server {
  return http.createServer((req, res) => {
    const url = new URL(req.url ?? "/", "http://localhost");
    const match = req.method === "GET" ? url.pathname.match(MENU_PATH_PATTERN) : null;

    if (!match) {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Not found" }));
      return;
    }

    const restaurantId = decodeURIComponent(match[1]);
    const { status, body } = getMenuResponse(menuStore, restaurantId);
    res.writeHead(status, {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    });
    res.end(JSON.stringify(body));
  });
}

const isMain = process.argv[1] && import.meta.url === new URL(process.argv[1], "file:").href;
if (isMain) {
  const port = Number(process.env.ARC_DEV_PORT) || 8010;
  createServer().listen(port, () => {
    console.log(`API listening on port ${port}`);
  });
}
