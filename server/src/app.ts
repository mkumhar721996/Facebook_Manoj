import http, { type Server } from "node:http";
import { handleGetTasks } from "./routes/tasks.ts";
import type { TaskRepository } from "./repositories/taskRepository.ts";

export function createApp(repository: TaskRepository, internalApiSecret: string): Server {
  return http.createServer((req, res) => {
    const url = new URL(req.url ?? "/", "http://localhost");

    if (req.method === "GET" && url.pathname === "/api/tasks") {
      handleGetTasks(req, res, repository, url.searchParams, internalApiSecret);
      return;
    }

    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Not Found" }));
  });
}
