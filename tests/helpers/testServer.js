const http = require('http');
const app = require('../../src/app');
const auth = require('../../src/lib/auth');

function startServer() {
  return new Promise((resolve) => {
    const server = http.createServer(app);
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      resolve({ server, baseUrl: `http://127.0.0.1:${port}` });
    });
  });
}

function stopServer(server) {
  return new Promise((resolve) => server.close(resolve));
}

function authHeaders(userId) {
  return { Authorization: `Bearer ${auth.sign(userId)}` };
}

module.exports = { startServer, stopServer, authHeaders };
