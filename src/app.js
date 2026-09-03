const http = require('http');
const session = require('./auth/session');
const { handleDashboardRequest } = require('./dashboard/dashboardRoute');

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
    });
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

function createApp() {
  return http.createServer(async (req, res) => {
    const url = new URL(req.url, 'http://localhost');

    if (req.method === 'POST' && url.pathname === '/login') {
      let body;
      try {
        body = await readJsonBody(req);
      } catch {
        res.writeHead(400, { 'Content-Type': 'text/plain' });
        res.end('Invalid request body');
        return;
      }
      const { userId, password } = body;
      if (!userId || !password || !session.verifyCredentials(userId, password)) {
        res.writeHead(401, { 'Content-Type': 'text/plain' });
        res.end('Invalid credentials');
        return;
      }
      res.writeHead(200, {
        'Content-Type': 'text/plain',
        'Set-Cookie': session.createSessionCookie(userId),
      });
      res.end('OK');
      return;
    }

    if (req.method === 'GET' && url.pathname === '/dashboard') {
      const userId = session.resolveUserId(req);
      if (!userId) {
        res.writeHead(401, { 'Content-Type': 'text/plain' });
        res.end('Unauthorized');
        return;
      }
      const html = handleDashboardRequest(userId);
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(html);
      return;
    }

    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  });
}

module.exports = { createApp };
