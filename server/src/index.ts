// Runs directly under `node` (>=22.6, type-stripping on by default) — no ts-node/tsx/build step.
import { createApp } from "./app.ts";
import { InMemoryTaskRepository } from "./repositories/taskRepository.ts";

const port = Number(process.env.ARC_DEV_PORT ?? 8005);

const internalApiSecret = process.env.INTERNAL_API_SECRET;
if (!internalApiSecret) {
  throw new Error(
    "INTERNAL_API_SECRET must be set so requests from the web tier can be authenticated"
  );
}

const repository = new InMemoryTaskRepository();
const app = createApp(repository, internalApiSecret);

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
