import http, { type IncomingMessage, type ServerResponse } from 'node:http';
import { URL } from 'node:url';
import { getAuthenticatedUserId } from './auth/requireAuth.ts';
import { createSessionToken } from './auth/session.ts';
import type { UserStore } from './auth/userStore.ts';
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

function readJsonBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
    });
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  });
}

async function handleLogin(
  req: IncomingMessage,
  res: ServerResponse,
  userStore: UserStore,
): Promise<void> {
  let body: unknown;
  try {
    body = await readJsonBody(req);
  } catch {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Invalid JSON body' }));
    return;
  }

  const { username, password } = (body ?? {}) as { username?: unknown; password?: unknown };
  if (typeof username !== 'string' || typeof password !== 'string') {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'username and password are required' }));
    return;
  }

  const userId = userStore.verifyCredentials(username, password);
  if (!userId) {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Invalid credentials' }));
    return;
  }

  const token = createSessionToken(userId);
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ token }));
}

export function createApp(repository: TaskRepository, userStore: UserStore): http.Server {
  return http.createServer((req, res) => {
    const url = new URL(req.url ?? '/', 'http://localhost');

    if (req.method === 'POST' && url.pathname === '/api/login') {
      void handleLogin(req, res, userStore);
      return;
    }

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
