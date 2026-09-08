const { VALID_CHANNELS } = require("../services/notificationPreferenceStore");

const PREFERENCE_PATH_PATTERN =
  /^\/api\/customers\/([^/]+)\/notification-preference$/;

function matchNotificationPreferencePath(pathname) {
  const match = PREFERENCE_PATH_PATTERN.exec(pathname);
  return match ? decodeURIComponent(match[1]) : null;
}

function sendJson(res, statusCode, body) {
  const payload = JSON.stringify(body);
  res.writeHead(statusCode, {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(payload),
  });
  res.end(payload);
}

async function readJsonBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

function createNotificationPreferencesRouter({ preferenceStore }) {
  return async function handleNotificationPreferencesRequest(req, res, customerId) {
    if (req.method === "GET") {
      sendJson(res, 200, { channel: preferenceStore.getPreference(customerId) });
      return;
    }

    if (req.method === "PUT") {
      let body;
      try {
        body = await readJsonBody(req);
      } catch {
        sendJson(res, 400, { error: "Invalid JSON body" });
        return;
      }

      if (!VALID_CHANNELS.has(body.channel)) {
        sendJson(res, 400, {
          error: `channel must be one of: ${[...VALID_CHANNELS].join(", ")}`,
        });
        return;
      }

      preferenceStore.setPreference(customerId, body.channel);
      sendJson(res, 200, { channel: body.channel });
      return;
    }

    sendJson(res, 405, { error: "Method not allowed" });
  };
}

module.exports = {
  createNotificationPreferencesRouter,
  matchNotificationPreferencePath,
};
