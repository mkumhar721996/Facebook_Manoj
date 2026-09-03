const store = require('../store');

/**
 * Placeholder auth: resolves the "logged-in user" from an x-user-id header.
 * Stands in for a real login/session story, which is out of scope here.
 * Returns the userId if valid, otherwise null.
 */
function resolveUserId(req) {
  const userId = req.headers['x-user-id'];
  if (!userId || !store.getUser(userId)) {
    return null;
  }
  return userId;
}

module.exports = { resolveUserId };
