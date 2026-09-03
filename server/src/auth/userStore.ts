import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

interface StoredUser {
  id: string;
  username: string;
  salt: string;
  passwordHash: Buffer;
}

const KEY_LENGTH = 64;

export class UserStore {
  private users: StoredUser[] = [];

  addUser(id: string, username: string, password: string): void {
    const salt = randomBytes(16).toString('hex');
    const passwordHash = scryptSync(password, salt, KEY_LENGTH);
    this.users.push({ id, username, salt, passwordHash });
  }

  verifyCredentials(username: string, password: string): string | null {
    const user = this.users.find((candidate) => candidate.username === username);
    if (!user) return null;

    const candidateHash = scryptSync(password, user.salt, KEY_LENGTH);
    if (candidateHash.length !== user.passwordHash.length) return null;
    if (!timingSafeEqual(candidateHash, user.passwordHash)) return null;

    return user.id;
  }
}
