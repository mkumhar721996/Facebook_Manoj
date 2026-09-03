const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { URL } = require('node:url');
const taskStore = require('./models/taskStore');
const { requireAuth } = require('./middleware/auth');

const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const CONTENT_TYPES = { '.html': 'text/html', '.js': 'text/javascript' };

function sendJson(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(payload);
}

function serveStatic(req, res, pathname) {
  const relativePath = pathname === '/' ? '/index.html' : pathname;
  const filePath = path.join(PUBLIC_DIR, relativePath);
  if (!filePath.startsWith(PUBLIC_DIR)) {
    sendJson(res, 404, { error: 'Not found' });
    return;
  }
  fs.readFile(filePath, (err, content) => {
    if (err) {
      sendJson(res, 404, { error: 'Not found' });
      return;
    }
    const contentType = CONTENT_TYPES[path.extname(filePath)] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  });
}

function createApp() {
  return http.createServer((req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const user = requireAuth(req);

    if (url.pathname === '/api/tasks' && req.method === 'GET') {
      sendJson(res, 200, taskStore.list(user.id));
      return;
    }

    const toggleMatch = url.pathname.match(/^\/api\/tasks\/([^/]+)\/toggle$/);
    if (toggleMatch && req.method === 'PATCH') {
      const updated = taskStore.toggle(toggleMatch[1], user.id);
      if (!updated) {
        sendJson(res, 404, { error: 'Task not found' });
        return;
      }
      sendJson(res, 200, updated);
      return;
    }

    const deleteMatch = url.pathname.match(/^\/api\/tasks\/([^/]+)$/);
    if (deleteMatch && req.method === 'DELETE') {
      const removed = taskStore.remove(deleteMatch[1], user.id);
      if (!removed) {
        sendJson(res, 404, { error: 'Task not found' });
        return;
      }
      res.writeHead(204);
      res.end();
      return;
    }

    if (req.method === 'GET') {
      serveStatic(req, res, url.pathname);
      return;
    }

    sendJson(res, 404, { error: 'Not found' });
  });
}

module.exports = { createApp };
