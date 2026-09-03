import type { Sort } from "../models/task.ts";
import { isSortField, isSortOrder } from "../../../shared/validation/sort.ts";

const DEFAULT_SORT: Sort = { sortBy: "dueDate", order: "asc" };

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
