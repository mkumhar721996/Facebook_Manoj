import type { Server } from "node:http";
import { createApp } from "../src/app.ts";
import { InMemoryTaskRepository } from "../src/repositories/taskRepository.ts";
import type { Task } from "../src/models/task.ts";
import { createSignedToken } from "../../shared/auth/signedToken.ts";

export const TEST_INTERNAL_API_SECRET = "test-internal-api-secret";

export interface TestServer {
  baseUrl: string;
  repository: InMemoryTaskRepository;
  close: () => Promise<void>;
}

export function startTestServer(
  initialTasks: Task[] = [],
  internalApiSecret = TEST_INTERNAL_API_SECRET
): Promise<TestServer> {
  const repository = new InMemoryTaskRepository(initialTasks);
  const server: Server = createApp(repository, internalApiSecret);

  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      const port = typeof address === "object" && address ? address.port : 0;
      resolve({
        baseUrl: `http://127.0.0.1:${port}`,
        repository,
        close: () => new Promise((res) => server.close(() => res())),
      });
    });
  });
}

export function authHeader(
  userId: string,
  internalApiSecret = TEST_INTERNAL_API_SECRET
): Record<string, string> {
  return { "x-user-token": createSignedToken(userId, internalApiSecret) };
}
