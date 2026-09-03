import { SORTABLE_FIELDS, type SortField, type SortOrder } from "../models/task.ts";

export function isSortField(value: string | null | undefined): value is SortField {
  return !!value && SORTABLE_FIELDS.includes(value as SortField);
}

export function isSortOrder(value: string | null | undefined): value is SortOrder {
  return value === "asc" || value === "desc";
}
