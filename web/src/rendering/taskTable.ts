import type { Sort, SortField, Task } from "../models/task.ts";
import { buildSortHref } from "./sort.ts";
import { escapeHtml } from "./escapeHtml.ts";

const COLUMNS: Array<{ field: SortField; label: string }> = [
  { field: "dueDate", label: "Due Date" },
  { field: "priority", label: "Priority" },
  { field: "createdAt", label: "Created Date" },
];

function renderHeaderCell(field: SortField, label: string, currentSort: Sort): string {
  const href = escapeHtml(buildSortHref(currentSort, field));
  const isActive = currentSort.sortBy === field;
  const indicator = isActive ? (currentSort.order === "asc" ? " ▲" : " ▼") : "";
  return `<th><a href="${href}" data-sort-field="${field}">${escapeHtml(label)}${indicator}</a></th>`;
}

function renderTitleHeaderCell(): string {
  return "<th>Title</th>";
}

function renderRow(task: Task): string {
  return `<tr>
    <td>${escapeHtml(task.title)}</td>
    <td>${escapeHtml(task.dueDate)}</td>
    <td>${escapeHtml(task.priority)}</td>
    <td>${escapeHtml(task.createdAt)}</td>
  </tr>`;
}

export function renderTaskTable(tasks: Task[], currentSort: Sort): string {
  const headerCells =
    renderTitleHeaderCell() +
    COLUMNS.map(({ field, label }) => renderHeaderCell(field, label, currentSort)).join("");
  const rows = tasks.map(renderRow).join("");

  return `<table>
    <thead><tr>${headerCells}</tr></thead>
    <tbody>${rows}</tbody>
  </table>`;
}
