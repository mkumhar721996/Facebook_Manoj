import { requireAuth } from "../auth/middleware.ts";
import type { RouteResult } from "../auth/routes.ts";

export function handleGetTasks(authHeader: string | undefined): RouteResult {
  const auth = requireAuth(authHeader);
  if (!auth.authorized) {
    return { status: 401, body: { error: "Unauthorized" } };
  }
  return { status: 200, body: { tasks: [] } };
}
