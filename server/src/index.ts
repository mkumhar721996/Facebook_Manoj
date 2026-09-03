import { createApp } from './app.ts';
import { TaskRepository } from './tasks/taskRepository.ts';

const port = Number(process.env.ARC_DEV_PORT ?? 8000);
const repository = new TaskRepository();
const server = createApp(repository);

server.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
