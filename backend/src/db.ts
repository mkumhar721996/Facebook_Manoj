export interface UserRecord {
  id: number;
  email: string;
  passwordHash: string;
  createdAt: string;
}

export interface Db {
  users: Map<string, UserRecord>;
  nextId: number;
}

export function createDb(): Db {
  return { users: new Map(), nextId: 1 };
}
