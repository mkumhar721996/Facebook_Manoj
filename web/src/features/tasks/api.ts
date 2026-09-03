import { buildTaskQuery } from './buildTaskQuery.ts';
import { getAuthToken, setAuthToken } from './authToken.ts';
import type { Task, TaskFilters } from './task.types.ts';

function authHeaders(): Record<string, string> {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function fetchTasks(filters: TaskFilters): Promise<Task[]> {
  const query = buildTaskQuery(filters);
  const response = await fetch(`/api/tasks${query ? `?${query}` : ''}`, {
    headers: authHeaders(),
  });
  return response.json();
}

export async function login(username: string, password: string): Promise<string> {
  const response = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  const { token } = await response.json();
  setAuthToken(token);
  return token;
}
