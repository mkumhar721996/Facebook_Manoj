const { URL } = require('url');
const tasksRoutes = require('./routes/tasks');
const auth = require('./lib/auth');

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
    });
    req.on('end', () => {
      if (!data) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(data));
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res, status, payload) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(payload));
}

function getBearerToken(req) {
  const header = req.headers['authorization'];
  if (typeof header !== 'string' || !header.startsWith('Bearer ')) return null;
  return header.slice('Bearer '.length).trim();
}

async function app(req, res) {
  const userId = auth.verify(getBearerToken(req));
  if (!userId) {
    sendJson(res, 401, { errors: [{ field: 'auth', message: 'A valid Authorization bearer token is required.' }] });
    return;
  }

  const { pathname } = new URL(req.url, 'http://localhost');

  try {
    if (pathname === '/tasks' && req.method === 'POST') {
      let body;
      try {
        body = await readBody(req);
      } catch (err) {
        sendJson(res, 400, { errors: [{ field: 'body', message: 'Invalid JSON body.' }] });
        return;
      }
      const result = tasksRoutes.createTask(userId, body);
      sendJson(res, result.status, result.body);
      return;
    }

    if (pathname === '/tasks' && req.method === 'GET') {
      const result = tasksRoutes.listTasks(userId);
      sendJson(res, result.status, result.body);
      return;
    }

    const idMatch = /^\/tasks\/([^/]+)$/.exec(pathname);
    if (idMatch && req.method === 'PUT') {
      let body;
      try {
        body = await readBody(req);
      } catch (err) {
        sendJson(res, 400, { errors: [{ field: 'body', message: 'Invalid JSON body.' }] });
        return;
      }
      const result = tasksRoutes.updateTask(userId, idMatch[1], body);
      sendJson(res, result.status, result.body);
      return;
    }

    sendJson(res, 404, { errors: [{ field: 'route', message: 'Not found.' }] });
  } catch (err) {
    console.error('Unhandled error while processing request:', err);
    sendJson(res, 500, { errors: [{ field: 'server', message: 'Internal server error.' }] });
  }
}

module.exports = app;
