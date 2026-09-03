import type { Db, UserRecord } from "../db.ts";

export function findByEmail(db: Db, email: string): UserRecord | undefined {
  return db.users.get(email.toLowerCase());
}

export function create(db: Db, email: string, passwordHash: string): UserRecord {
  const user: UserRecord = {
    id: db.nextId++,
    email: email.toLowerCase(),
    passwordHash,
    createdAt: new Date().toISOString(),
  };
  db.users.set(user.email, user);
  return user;
}
