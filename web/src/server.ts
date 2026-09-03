import http, { type Server } from "node:http";
import { fetchTasks } from "./api/tasksApi.ts";
import { renderTaskListPage } from "./rendering/taskListPage.ts";
import { parseRequestedSort, parseRequestedPage } from "./rendering/requestState.ts";
import { verifySession } from "./session.ts";

export function createWebServer(
  apiBaseUrl: string,
  sessionSecret: string,
  internalApiSecret: string,
  fetchImpl: typeof fetch = fetch
): Server {
  return http.createServer(async (req, res) => {
    const url = new URL(req.url ?? "/", "http://localhost");

    if (req.method === "GET" && url.pathname === "/tasks") {
      const userId = verifySession(req.headers.cookie, sessionSecret);

      if (!userId) {
        res.writeHead(401, { "Content-Type": "text/plain" });
        res.end("Not logged in");
        return;
      }

      const sort = parseRequestedSort(url.searchParams);
      const page = parseRequestedPage(url.searchParams);

      let result;
      try {
        result = await fetchTasks(
          apiBaseUrl,
          userId,
          internalApiSecret,
          { ...sort, page },
          fetchImpl
        );
      } catch (err) {
        console.error("Failed to fetch tasks:", err);
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
