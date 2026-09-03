// Runs directly under `node` (>=22.6, type-stripping on by default) — no ts-node/tsx/build step.
import { createWebServer } from "./server.ts";

const port = Number(process.env.ARC_WEB_PORT ?? 3005);
const apiPort = process.env.ARC_DEV_PORT ?? 8005;
const apiBaseUrl = `http://localhost:${apiPort}`;

const sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret) {
  throw new Error("SESSION_SECRET must be set so session cookies can be signed and verified");
}

const server = createWebServer(apiBaseUrl, sessionSecret);

server.listen(port, () => {
  console.log(`Web server listening on port ${port}`);
});
