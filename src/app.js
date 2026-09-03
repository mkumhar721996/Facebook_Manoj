const http = require('http');
const session = require('./auth/session');
const { handleDashboardRequest } = require('./dashboard/dashboardRoute');

function createApp() {
  return http.createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost');

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
