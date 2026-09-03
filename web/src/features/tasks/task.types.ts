export type Status = 'incomplete' | 'complete';
export type Priority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: Status;
  priority: Priority;
  tags: string[];
  category: string;
  dueDate: string | null;
}

export interface TaskFilters {
  search?: string;
  status?: Status;
  priority?: Priority;
  tag?: string;
  category?: string;
  dueStart?: string;
  dueEnd?: string;
}
