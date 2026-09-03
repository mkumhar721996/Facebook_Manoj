export interface PasswordResetToken {
  token: string;
  userId: string;
  expiresAt: number;
  usedAt: number | null;
}

export interface PasswordResetTokenRepository {
  create(userId: string, token: string, expiresAt: number): PasswordResetToken;
  findByToken(token: string): PasswordResetToken | undefined;
  markUsed(token: string): void;
}

export class InMemoryPasswordResetTokenRepository implements PasswordResetTokenRepository {
  private readonly byToken = new Map<string, PasswordResetToken>();

  create(userId: string, token: string, expiresAt: number): PasswordResetToken {
    const record: PasswordResetToken = { token, userId, expiresAt, usedAt: null };
    this.byToken.set(token, record);
    return record;
  }

  findByToken(token: string): PasswordResetToken | undefined {
    return this.byToken.get(token);
  }

  markUsed(token: string): void {
    const record = this.byToken.get(token);
    if (!record) {
      return;
    }
    record.usedAt = Date.now();
  }
}
