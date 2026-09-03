import type { Sort, TaskListResult } from "../models/task.ts";
import { createSignedToken } from "../../../shared/auth/signedToken.ts";

export interface FetchTasksOptions {
  sortBy?: Sort["sortBy"];
  order?: Sort["order"];
  page?: number;
}

export async function fetchTasks(
  apiBaseUrl: string,
  userId: string,
  internalApiSecret: string,
  options: FetchTasksOptions,
  fetchImpl: typeof fetch = fetch
): Promise<TaskListResult> {
  const params = new URLSearchParams({
    sortBy: options.sortBy ?? "dueDate",
    order: options.order ?? "asc",
    page: String(options.page ?? 1),
  });

  const response = await fetchImpl(`${apiBaseUrl}/api/tasks?${params.toString()}`, {
    headers: { "x-user-token": createSignedToken(userId, internalApiSecret) },
  });

  return response.json();
}
