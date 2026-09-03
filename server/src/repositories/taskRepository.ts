import {
  DEFAULT_SORT_FIELD,
  DEFAULT_SORT_ORDER,
  PAGE_SIZE,
  PRIORITY_ORDER,
  type SortField,
  type SortOrder,
  type Task,
} from "../models/task.ts";
import { isSortField, isSortOrder } from "../../../shared/validation/sort.ts";

export interface ListOptions {
  sortBy?: string;
  order?: string;
  page?: number;
}

export interface ListResult {
  tasks: Task[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface TaskRepository {
  list(userId: string, options: ListOptions): ListResult;
}

function compareBy(field: SortField, a: Task, b: Task): number {
  if (field === "priority") {
    return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
  }
  return a[field] < b[field] ? -1 : a[field] > b[field] ? 1 : 0;
}

export class InMemoryTaskRepository implements TaskRepository {
  private tasks: Task[];

  constructor(initialTasks: Task[] = []) {
    this.tasks = [...initialTasks];
  }

  list(userId: string, options: ListOptions): ListResult {
    const sortBy = isSortField(options.sortBy) ? options.sortBy : DEFAULT_SORT_FIELD;
    const order = isSortOrder(options.order) ? options.order : DEFAULT_SORT_ORDER;
    const requestedPage = options.page && options.page > 0 ? options.page : 1;

    const userTasks = this.tasks.filter((t) => t.userId === userId);

    const sorted = [...userTasks].sort((a, b) => {
      const cmp = compareBy(sortBy, a, b);
      return order === "asc" ? cmp : -cmp;
    });

    const totalCount = sorted.length;
    const totalPages = Math.ceil(totalCount / PAGE_SIZE);
    const page = totalPages === 0 ? 1 : Math.min(requestedPage, totalPages);

    const start = (page - 1) * PAGE_SIZE;
    const tasks = sorted.slice(start, start + PAGE_SIZE);

    return { tasks, page, pageSize: PAGE_SIZE, totalCount, totalPages };
  }
}
