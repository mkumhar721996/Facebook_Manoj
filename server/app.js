const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { createNotificationPreferenceStore } = require("./services/notificationPreferenceStore");
const {
  createNotificationPreferencesRouter,
  matchNotificationPreferencePath,
} = require("./routes/notificationPreferences");

const REPO_ROOT = path.join(__dirname, "..");
const DESIGN_ROOT = path.join(REPO_ROOT, "docs", "design");
const WEB_ROOT = path.join(REPO_ROOT, "web");

const CONTENT_TYPES_BY_EXTENSION = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
};

function resolveStaticFile(pathname) {
  const [root, relativePath] = pathname.startsWith("/docs/design/")
    ? [DESIGN_ROOT, pathname.slice("/docs/design".length)]
    : [WEB_ROOT, pathname === "/" ? "/notification-preferences.html" : pathname];

  const filePath = path.join(root, relativePath);
  const isWithinRoot = filePath.startsWith(root + path.sep);
  if (isWithinRoot && fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    return filePath;
  }
  return null;
}

function createApp({ preferenceStore = createNotificationPreferenceStore() } = {}) {
  const handleNotificationPreferencesRequest = createNotificationPreferencesRouter({
    preferenceStore,
  });

  return http.createServer(async (req, res) => {
    const { pathname } = new URL(req.url, "http://localhost");
    const customerId = matchNotificationPreferencePath(pathname);

    if (customerId) {
      await handleNotificationPreferencesRequest(req, res, customerId);
      return;
    }

    const staticFilePath = resolveStaticFile(pathname);
    if (staticFilePath) {
      const contentType = CONTENT_TYPES_BY_EXTENSION[path.extname(staticFilePath)] || "application/octet-stream";
      res.writeHead(200, { "Content-Type": contentType });
      res.end(fs.readFileSync(staticFilePath));
      return;
    }

    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Not found" }));
  });
}

module.exports = { createApp };
