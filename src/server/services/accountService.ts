import { randomBytes, randomUUID, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import type { Account, AccountRepository } from "../repositories/accountRepository.ts";
import type { EmailSender } from "../email/emailSender.ts";

const scrypt = promisify(scryptCallback);
const SCRYPT_KEY_LENGTH = 64;

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = (await scrypt(password, salt, SCRYPT_KEY_LENGTH)) as Buffer;
  return `${salt}:${derivedKey.toString("hex")}`;
}

async function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
  const [salt, storedHex] = passwordHash.split(":");
  if (!salt || !storedHex) return false;
  const storedKey = Buffer.from(storedHex, "hex");
  const derivedKey = (await scrypt(password, salt, SCRYPT_KEY_LENGTH)) as Buffer;
  if (derivedKey.length !== storedKey.length) return false;
  return timingSafeEqual(derivedKey, storedKey);
}

export type SignupInput = {
  email: string;
  password: string;
};

export type CreateAccountResult =
  | { outcome: "created"; message: string; verificationToken: string }
  | { outcome: "verification-resent"; message: string }
  | { outcome: "email-taken"; message: string };

export type AuthenticateResult =
  | { outcome: "authenticated"; accountId: string }
  | { outcome: "denied-unverified"; message: string }
  | { outcome: "denied-invalid-credentials"; message: string };

export type VerifyAccountResult =
  | { outcome: "verified"; accountId: string }
  | { outcome: "invalid-token"; message: string };

export class AccountService {
  constructor(repository: AccountRepository, emailSender: EmailSender) {
    this.repository = repository;
    this.emailSender = emailSender;
  }

  private repository: AccountRepository;
  private emailSender: EmailSender;

  async createAccount(input: SignupInput): Promise<CreateAccountResult> {
    const existing = await this.repository.findByEmail(input.email);

    if (existing && existing.status === "verified") {
      return {
        outcome: "email-taken",
        message: "This email is already registered. Please log in or reset your password.",
      };
    }

    if (existing && existing.status === "unverified") {
      const verificationToken = randomUUID();
      const resent: Account = { ...existing, verificationToken };
      await this.repository.save(resent);
      await this.emailSender.sendVerificationEmail(resent.email, verificationToken);
      return {
        outcome: "verification-resent",
        message: "We've resent your verification email. Please check your inbox to activate your account.",
      };
    }

    const passwordHash = await hashPassword(input.password);
    const verificationToken = randomUUID();
    const account: Account = {
      id: randomUUID(),
      email: input.email,
      passwordHash,
      status: "unverified",
      verificationToken,
    };
    await this.repository.save(account);
    await this.emailSender.sendVerificationEmail(account.email, verificationToken);

    return {
      outcome: "created",
      message: "Account created. Please check your inbox to verify your email.",
      verificationToken,
    };
  }

  async authenticate(input: SignupInput): Promise<AuthenticateResult> {
    const account = await this.repository.findByEmail(input.email);
    if (!account) {
      return { outcome: "denied-invalid-credentials", message: "Invalid email or password." };
    }

    const passwordMatches = await verifyPassword(input.password, account.passwordHash);
    if (!passwordMatches) {
      return { outcome: "denied-invalid-credentials", message: "Invalid email or password." };
    }

    if (account.status !== "verified") {
      return {
        outcome: "denied-unverified",
        message: "Please check your inbox for the verification link before logging in.",
      };
    }

    return { outcome: "authenticated", accountId: account.id };
  }

  async verifyAccount(token: string): Promise<VerifyAccountResult> {
    const account = await this.repository.findByVerificationToken(token);
    if (!account) {
      return { outcome: "invalid-token", message: "This verification link is invalid or has expired." };
    }

    const verified: Account = { ...account, status: "verified", verificationToken: undefined };
    await this.repository.save(verified);

    return { outcome: "verified", accountId: verified.id };
  }
}
