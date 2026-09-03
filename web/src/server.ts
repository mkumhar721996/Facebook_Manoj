import http, { type Server } from "node:http";
import { fetchTasks } from "./api/tasksApi.ts";
import { renderTaskListPage } from "./rendering/taskListPage.ts";
import { parseRequestedSort, parseRequestedPage } from "./rendering/requestState.ts";
import { parseCookies } from "./cookies.ts";

export function createWebServer(apiBaseUrl: string, fetchImpl: typeof fetch = fetch): Server {
  return http.createServer(async (req, res) => {
    const url = new URL(req.url ?? "/", "http://localhost");

    if (req.method === "GET" && url.pathname === "/tasks") {
      const cookies = parseCookies(req.headers.cookie);
      const userId = cookies.userId;

      if (!userId) {
        res.writeHead(401, { "Content-Type": "text/plain" });
        res.end("Not logged in");
        return;
      }

      const sort = parseRequestedSort(url.searchParams);
      const page = parseRequestedPage(url.searchParams);

      let result;
      try {
        result = await fetchTasks(apiBaseUrl, userId, { ...sort, page }, fetchImpl);
      } catch {
        res.writeHead(500, { "Content-Type": "text/plain" });
        res.end("Internal server error");
        return;
      }

      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(renderTaskListPage(result, sort));
      return;
    }

    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not Found");
  });
}
