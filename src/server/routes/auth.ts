import type { IncomingMessage, ServerResponse } from "node:http";
import { validateSignup } from "../../shared/validation.js";
import type { AccountService } from "../services/accountService.ts";
import { InMemorySessionStore, SESSION_COOKIE_NAME } from "../session/sessionStore.ts";

export type AuthRouteDeps = {
  accountService: AccountService;
  sessionStore: InMemorySessionStore;
};

function readJsonBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
    });
    req.on("end", () => {
      if (!raw) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error("Invalid JSON body"));
      }
    });
    req.on("error", reject);
  });
}

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { "content-type": "application/json" });
  res.end(JSON.stringify(body));
}

function parseCookies(header: string | undefined): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!header) return cookies;
  for (const part of header.split(";")) {
    const [rawName, ...rawValue] = part.trim().split("=");
    if (!rawName) continue;
    cookies[rawName] = decodeURIComponent(rawValue.join("="));
  }
  return cookies;
}

function setSessionCookie(res: ServerResponse, sessionId: string): void {
  res.setHeader(
    "Set-Cookie",
    `${SESSION_COOKIE_NAME}=${sessionId}; HttpOnly; Path=/; SameSite=Lax`,
  );
}

export async function handleSignup(
  req: IncomingMessage,
  res: ServerResponse,
  deps: AuthRouteDeps,
): Promise<void> {
  const body = await readJsonBody(req);
  const email = typeof body.email === "string" ? body.email : "";
  const password = typeof body.password === "string" ? body.password : "";

  const validation = validateSignup({ email, password });
  if (!validation.valid) {
    sendJson(res, 400, { errors: validation.errors });
    return;
  }

  const result = await deps.accountService.createAccount({ email, password });

  if (result.outcome === "email-taken") {
    sendJson(res, 409, { message: result.message });
    return;
  }

  if (result.outcome === "verification-resent") {
    sendJson(res, 200, { message: result.message });
    return;
  }

  sendJson(res, 201, { message: result.message });
}

export async function handleLogin(
  req: IncomingMessage,
  res: ServerResponse,
  deps: AuthRouteDeps,
): Promise<void> {
  const body = await readJsonBody(req);
  const email = typeof body.email === "string" ? body.email : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!email || !password) {
    sendJson(res, 400, { message: "Email and password are required." });
    return;
  }

  const result = await deps.accountService.authenticate({ email, password });

  if (result.outcome === "denied-unverified") {
    sendJson(res, 403, { message: result.message });
    return;
  }

  if (result.outcome === "denied-invalid-credentials") {
    sendJson(res, 401, { message: result.message });
    return;
  }

  const sessionId = deps.sessionStore.create(result.accountId);
  setSessionCookie(res, sessionId);
  sendJson(res, 200, { message: "Logged in." });
}

export async function handleVerify(
  req: IncomingMessage,
  res: ServerResponse,
  deps: AuthRouteDeps,
  token: string,
): Promise<void> {
  const result = await deps.accountService.verifyAccount(token);

  if (result.outcome === "invalid-token") {
    sendJson(res, 400, { message: result.message });
    return;
  }

  const sessionId = deps.sessionStore.create(result.accountId);
  setSessionCookie(res, sessionId);
  sendJson(res, 200, { message: "Your email has been verified." });
}

export async function handleMe(
  req: IncomingMessage,
  res: ServerResponse,
  deps: AuthRouteDeps,
): Promise<void> {
  const cookies = parseCookies(req.headers.cookie);
  const sessionId = cookies[SESSION_COOKIE_NAME];
  const accountId = sessionId ? deps.sessionStore.getAccountId(sessionId) : undefined;

  if (!accountId) {
    sendJson(res, 401, { message: "Not authenticated." });
    return;
  }

  sendJson(res, 200, { accountId });
}
