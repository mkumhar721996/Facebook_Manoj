import type { Sort, SortField, SortOrder } from "../models/task.ts";

const SORTABLE_FIELDS: SortField[] = ["dueDate", "priority", "createdAt"];
const DEFAULT_SORT: Sort = { sortBy: "dueDate", order: "asc" };

function isSortField(value: string | null): value is SortField {
  return !!value && SORTABLE_FIELDS.includes(value as SortField);
}

function isSortOrder(value: string | null): value is SortOrder {
  return value === "asc" || value === "desc";
}

export function parseRequestedSort(query: URLSearchParams): Sort {
  const sortBy = query.get("sortBy");
  const order = query.get("order");
  if (!isSortField(sortBy) || !isSortOrder(order)) {
    return DEFAULT_SORT;
  }
  return { sortBy, order };
}

export function parseRequestedPage(query: URLSearchParams): number {
  const page = Number(query.get("page"));
  return Number.isFinite(page) && page > 0 ? page : 1;
}
