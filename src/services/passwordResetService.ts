import { randomBytes } from "node:crypto";

import type { UserRepository } from "../repositories/userRepository.ts";
import type { PasswordResetTokenRepository } from "../repositories/passwordResetTokenRepository.ts";
import type { EmailSender } from "../email/emailSender.ts";
import { isStrongPassword } from "../validation/passwordStrength.ts";

export interface RequestResetResult {
  status: "ok";
}

export type ConfirmResetResult =
  | { status: "ok"; redirectTo: "/login" }
  | { status: "error"; reason: "invalid_or_expired_token" | "weak_password" };

interface PasswordHasher {
  hash(plain: string): string;
  verify(plain: string, storedHash: string): boolean;
}

export interface PasswordResetServiceDeps {
  userRepository: UserRepository;
  tokenRepository: PasswordResetTokenRepository;
  emailSender: EmailSender;
  passwordHasher: PasswordHasher;
  ttlMs: number;
  baseUrl: string;
}

export class PasswordResetService {
  private readonly deps: PasswordResetServiceDeps;

  constructor(deps: PasswordResetServiceDeps) {
    this.deps = deps;
  }

  async requestReset(email: string): Promise<RequestResetResult> {
    const user = this.deps.userRepository.findByEmail(email);

    if (user) {
      const token = randomBytes(32).toString("hex");
      const expiresAt = Date.now() + this.deps.ttlMs;
      this.deps.tokenRepository.create(user.id, token, expiresAt);

      const resetLink = `${this.deps.baseUrl}/password-reset/confirm?token=${token}`;
      await this.deps.emailSender.sendPasswordResetEmail(user.email, resetLink);
    }

    return { status: "ok" };
  }

  async confirmReset(token: string, newPassword: string): Promise<ConfirmResetResult> {
    const record = this.deps.tokenRepository.findByToken(token);

    if (!record || record.usedAt !== null || record.expiresAt <= Date.now()) {
      return { status: "error", reason: "invalid_or_expired_token" };
    }

    if (!isStrongPassword(newPassword)) {
      return { status: "error", reason: "weak_password" };
    }

    const passwordHash = this.deps.passwordHasher.hash(newPassword);
    this.deps.userRepository.updatePasswordHash(record.userId, passwordHash);
    this.deps.tokenRepository.markUsed(token);

    return { status: "ok", redirectTo: "/login" };
  }
}
