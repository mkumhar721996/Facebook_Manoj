export type Priority = "low" | "medium" | "high";

export interface Task {
  id: string;
  userId: string;
  title: string;
  dueDate: string;
  priority: Priority;
  createdAt: string;
}

export type SortField = "dueDate" | "priority" | "createdAt";
export type SortOrder = "asc" | "desc";

export const SORTABLE_FIELDS: SortField[] = ["dueDate", "priority", "createdAt"];
