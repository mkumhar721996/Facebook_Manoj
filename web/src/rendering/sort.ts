import type { Sort, SortField } from "../models/task.ts";

export function computeNextSort(current: Sort, clickedField: SortField): Sort {
  if (current.sortBy === clickedField) {
    return { sortBy: clickedField, order: current.order === "asc" ? "desc" : "asc" };
  }
  return { sortBy: clickedField, order: "asc" };
}

export function buildSortHref(current: Sort, clickedField: SortField): string {
  const next = computeNextSort(current, clickedField);
  return `?sortBy=${next.sortBy}&order=${next.order}`;
}
