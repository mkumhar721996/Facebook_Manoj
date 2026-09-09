export type AccountStatus = "unverified" | "verified";

export type Account = {
  id: string;
  email: string;
  passwordHash: string;
  status: AccountStatus;
  verificationToken?: string;
};

export interface AccountRepository {
  findByEmail(email: string): Promise<Account | undefined>;
  findByVerificationToken(token: string): Promise<Account | undefined>;
  save(account: Account): Promise<void>;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export class InMemoryAccountRepository implements AccountRepository {
  private accountsByEmail = new Map<string, Account>();

  async findByEmail(email: string): Promise<Account | undefined> {
    return this.accountsByEmail.get(normalizeEmail(email));
  }

  async findByVerificationToken(token: string): Promise<Account | undefined> {
    for (const account of this.accountsByEmail.values()) {
      if (account.verificationToken === token) {
        return account;
      }
    }
    return undefined;
  }

  async save(account: Account): Promise<void> {
    this.accountsByEmail.set(normalizeEmail(account.email), account);
  }
}
