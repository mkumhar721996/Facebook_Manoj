import type { IncomingMessage } from "node:http";

export function requireAuth(req: IncomingMessage): string | null {
  const userId = req.headers["x-user-id"];
  if (typeof userId === "string" && userId.length > 0) {
    return userId;
  }
  return null;
}
