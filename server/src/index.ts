import { createApp } from "./app.ts";
import { InMemoryTaskRepository } from "./repositories/taskRepository.ts";

const port = Number(process.env.ARC_DEV_PORT ?? 8005);
const repository = new InMemoryTaskRepository();
const app = createApp(repository);

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
