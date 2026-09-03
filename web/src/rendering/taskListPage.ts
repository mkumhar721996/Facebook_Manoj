import type { Sort, TaskListResult } from "../models/task.ts";
import { renderTaskTable } from "./taskTable.ts";
import { renderPagination } from "./pagination.ts";
import { renderEmptyState } from "./emptyState.ts";

export function renderTaskListPage(result: TaskListResult, sort: Sort): string {
  const body =
    result.tasks.length === 0
      ? renderEmptyState()
      : `${renderTaskTable(result.tasks, sort)}${renderPagination(result.page, result.totalPages, sort)}`;

  return `<main>
    <h1>Tasks</h1>
    ${body}
  </main>`;
}
