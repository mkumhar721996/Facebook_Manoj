import { randomUUID } from "node:crypto";

export const SESSION_COOKIE_NAME = "session_id";

export class InMemorySessionStore {
  private accountIdBySessionId = new Map<string, string>();

  create(accountId: string): string {
    const sessionId = randomUUID();
    this.accountIdBySessionId.set(sessionId, accountId);
    return sessionId;
  }

  getAccountId(sessionId: string): string | undefined {
    return this.accountIdBySessionId.get(sessionId);
  }

  destroy(sessionId: string): void {
    this.accountIdBySessionId.delete(sessionId);
  }
}
