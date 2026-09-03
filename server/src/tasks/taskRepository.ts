import type { Task } from './task.types.ts';

export class TaskRepository {
  private tasks: Task[];

  constructor(tasks: Task[] = []) {
    this.tasks = tasks;
  }

  getByUser(userId: string): Task[] {
    return this.tasks.filter((task) => task.userId === userId);
  }
}
