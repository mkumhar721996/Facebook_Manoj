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

export interface Sort {
  sortBy: SortField;
  order: SortOrder;
}

export interface TaskListResult {
  tasks: Task[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}
