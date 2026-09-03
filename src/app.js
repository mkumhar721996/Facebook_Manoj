const http = require('http');
const session = require('./auth/session');
const { handleDashboardRequest } = require('./dashboard/dashboardRoute');

const MAX_BODY_SIZE = 1024 * 1024; // 1MB

class PayloadTooLargeError extends Error {}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    let rejected = false;
    req.on('data', (chunk) => {
      if (rejected) {
        return;
      }
      raw += chunk;
      if (raw.length > MAX_BODY_SIZE) {
        rejected = true;
        reject(new PayloadTooLargeError());
      }
    });
    req.on('end', () => {
      if (rejected) {
        return;
      }
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
      } catch (err) {
        if (err instanceof PayloadTooLargeError) {
          res.writeHead(413, { 'Content-Type': 'text/plain' });
          res.end('Payload too large');
        } else {
          res.writeHead(400, { 'Content-Type': 'text/plain' });
          res.end('Invalid request body');
        }
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
