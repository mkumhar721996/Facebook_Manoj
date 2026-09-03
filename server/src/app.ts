import http from 'node:http';
import { URL } from 'node:url';
import { getAuthenticatedUserId } from './auth/requireAuth.ts';
import { filterTasks } from './tasks/filterTasks.ts';
import type { TaskRepository } from './tasks/taskRepository.ts';
import type { Priority, Status, TaskFilters } from './tasks/task.types.ts';

const STATUS_VALUES: Status[] = ['incomplete', 'complete'];
const PRIORITY_VALUES: Priority[] = ['low', 'medium', 'high'];

function parseFilters(searchParams: URLSearchParams): TaskFilters {
  const filters: TaskFilters = {};

  const search = searchParams.get('search');
  if (search) filters.search = search;

  const status = searchParams.get('status');
  if (status && STATUS_VALUES.includes(status as Status)) filters.status = status as Status;

  const priority = searchParams.get('priority');
  if (priority && PRIORITY_VALUES.includes(priority as Priority)) {
    filters.priority = priority as Priority;
  }

  const tag = searchParams.get('tag');
  if (tag) filters.tag = tag;

  const category = searchParams.get('category');
  if (category) filters.category = category;

  const dueStart = searchParams.get('dueStart');
  if (dueStart) filters.dueStart = dueStart;

  const dueEnd = searchParams.get('dueEnd');
  if (dueEnd) filters.dueEnd = dueEnd;

  return filters;
}

export function createApp(repository: TaskRepository): http.Server {
  return http.createServer((req, res) => {
    const url = new URL(req.url ?? '/', 'http://localhost');

    if (req.method === 'GET' && url.pathname === '/api/tasks') {
      const userId = getAuthenticatedUserId(req);
      if (!userId) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Unauthorized' }));
        return;
      }

      const filters = parseFilters(url.searchParams);
      const tasks = filterTasks(repository.getByUser(userId), filters);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(tasks));
      return;
    }

    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not Found' }));
  });
}
