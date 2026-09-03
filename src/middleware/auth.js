const SESSIONS = {
  'demo-session-token': { id: 'demo-user' },
};

function requireAuth(req) {
  const header = req.headers['authorization'] || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) return null;
  return SESSIONS[token] || null;
}

module.exports = { requireAuth };
