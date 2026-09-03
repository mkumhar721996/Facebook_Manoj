import type { IncomingMessage, ServerResponse } from "node:http";
import { requireAuth } from "../middleware/auth.ts";
import type { TaskRepository } from "../repositories/taskRepository.ts";

export function handleGetTasks(
  req: IncomingMessage,
  res: ServerResponse,
  repository: TaskRepository,
  query: URLSearchParams
): void {
  const userId = requireAuth(req);
  if (!userId) {
    res.writeHead(401, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Unauthorized" }));
    return;
  }

  const page = Number(query.get("page"));
  const result = repository.list(userId, {
    sortBy: query.get("sortBy") ?? undefined,
    order: query.get("order") ?? undefined,
    page: Number.isFinite(page) && page > 0 ? page : undefined,
  });

  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify(result));
}
