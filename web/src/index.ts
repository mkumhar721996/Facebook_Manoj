import { createWebServer } from "./server.ts";

const port = Number(process.env.ARC_WEB_PORT ?? 3005);
const apiPort = process.env.ARC_DEV_PORT ?? 8005;
const apiBaseUrl = `http://localhost:${apiPort}`;

const server = createWebServer(apiBaseUrl);

server.listen(port, () => {
  console.log(`Web server listening on port ${port}`);
});
