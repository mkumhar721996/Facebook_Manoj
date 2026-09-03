export type Priority = "low" | "medium" | "high";

export interface Task {
  id: string;
  userId: string;
  title: string;
  dueDate: string;
  priority: Priority;
  createdAt: string;
}

export const PRIORITY_ORDER: Record<Priority, number> = {
  low: 0,
  medium: 1,
  high: 2,
};

export type SortField = "dueDate" | "priority" | "createdAt";
export type SortOrder = "asc" | "desc";

export const SORTABLE_FIELDS: SortField[] = ["dueDate", "priority", "createdAt"];
export const DEFAULT_SORT_FIELD: SortField = "dueDate";
export const DEFAULT_SORT_ORDER: SortOrder = "asc";
export const PAGE_SIZE = 10;
