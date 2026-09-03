export {
  type Priority,
  type Task,
  type SortField,
  type SortOrder,
  SORTABLE_FIELDS,
} from "../../../shared/models/task.ts";
import type { Priority, SortField, SortOrder } from "../../../shared/models/task.ts";

export const PRIORITY_ORDER: Record<Priority, number> = {
  low: 0,
  medium: 1,
  high: 2,
};

export const DEFAULT_SORT_FIELD: SortField = "dueDate";
export const DEFAULT_SORT_ORDER: SortOrder = "asc";
export const PAGE_SIZE = 10;
