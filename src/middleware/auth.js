const DEMO_SESSION_TOKEN = process.env.DEMO_SESSION_TOKEN || 'demo-session-token';

const SESSIONS = {
  [DEMO_SESSION_TOKEN]: { id: 'demo-user' },
};

function requireAuth(req) {
  const header = req.headers['authorization'] || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) return null;
  return SESSIONS[token] || null;
}

module.exports = { requireAuth, DEMO_SESSION_TOKEN };
