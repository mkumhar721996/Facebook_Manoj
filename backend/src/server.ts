import { createServer } from "node:http";
import { createApp } from "./app.ts";
import { createDb } from "./db.ts";

const db = createDb();
const app = createApp(db);
const port = Number(process.env.ARC_DEV_PORT ?? 8001);

createServer(app).listen(port, () => {
  console.log(`Backend listening on port ${port}`);
});
