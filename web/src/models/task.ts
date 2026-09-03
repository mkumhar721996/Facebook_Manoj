export {
  type Priority,
  type Task,
  type SortField,
  type SortOrder,
} from "../../../shared/models/task.ts";
import type { SortField, SortOrder, Task } from "../../../shared/models/task.ts";

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
