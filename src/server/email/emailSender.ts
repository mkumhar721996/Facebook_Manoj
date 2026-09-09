export interface EmailSender {
  sendVerificationEmail(to: string, verificationToken: string): Promise<void>;
}

export type SentEmail = {
  to: string;
  verificationToken: string;
};

export class FakeEmailSender implements EmailSender {
  sent: SentEmail[] = [];

  async sendVerificationEmail(to: string, verificationToken: string): Promise<void> {
    this.sent.push({ to, verificationToken });
  }
}

export class ConsoleEmailSender implements EmailSender {
  async sendVerificationEmail(to: string, verificationToken: string): Promise<void> {
    console.log(`[email] verification link for ${to}: /api/verify?token=${verificationToken}`);
  }
}
