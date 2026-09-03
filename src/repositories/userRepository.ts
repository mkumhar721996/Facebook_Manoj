import type { User } from "../domain/user.ts";

export interface UserRepository {
  findByEmail(email: string): User | undefined;
  updatePasswordHash(userId: string, passwordHash: string): void;
}

export class InMemoryUserRepository implements UserRepository {
  private readonly byId = new Map<string, User>();
  private readonly byEmail = new Map<string, User>();

  constructor(initialUsers: User[] = []) {
    for (const user of initialUsers) {
      this.byId.set(user.id, user);
      this.byEmail.set(user.email, user);
    }
  }

  findByEmail(email: string): User | undefined {
    return this.byEmail.get(email);
  }

  updatePasswordHash(userId: string, passwordHash: string): void {
    const user = this.byId.get(userId);
    if (!user) {
      return;
    }
    user.passwordHash = passwordHash;
  }
}
