export interface EmailSender {
  sendPasswordResetEmail(to: string, resetLink: string): Promise<void>;
}

export class FakeEmailSender implements EmailSender {
  readonly sentEmails: Array<{ to: string; resetLink: string }> = [];

  async sendPasswordResetEmail(to: string, resetLink: string): Promise<void> {
    this.sentEmails.push({ to, resetLink });
  }
}

export class ConsoleEmailSender implements EmailSender {
  async sendPasswordResetEmail(to: string, resetLink: string): Promise<void> {
    console.log(`Password reset link for ${to}: ${resetLink}`);
  }
}
