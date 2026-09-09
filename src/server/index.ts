import { createApp } from "./app.ts";
import { InMemoryAccountRepository } from "./repositories/accountRepository.ts";
import { ConsoleEmailSender } from "./email/emailSender.ts";
import { AccountService } from "./services/accountService.ts";
import { InMemorySessionStore } from "./session/sessionStore.ts";

const port = Number(process.env.ARC_DEV_PORT ?? 8024);

const accountService = new AccountService(new InMemoryAccountRepository(), new ConsoleEmailSender());
const sessionStore = new InMemorySessionStore();

const app = createApp({ accountService, sessionStore });

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
