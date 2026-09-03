import { createApp } from './app.ts';
import { TaskRepository } from './tasks/taskRepository.ts';
import { UserStore } from './auth/userStore.ts';

const port = Number(process.env.ARC_DEV_PORT ?? 8000);
const repository = new TaskRepository();
const userStore = new UserStore();
const server = createApp(repository, userStore);

server.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
