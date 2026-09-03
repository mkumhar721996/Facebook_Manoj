import type { IncomingMessage, ServerResponse } from "node:http";

import type { PasswordResetService } from "../services/passwordResetService.ts";

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
        reject(new Error("invalid_json"));
      }
    });
    req.on("error", reject);
  });
}

function sendJson(res: ServerResponse, statusCode: number, body: unknown): void {
  const payload = JSON.stringify(body);
  res.writeHead(statusCode, { "content-type": "application/json" });
  res.end(payload);
}

export async function handlePasswordResetRequest(
  req: IncomingMessage,
  res: ServerResponse,
  service: PasswordResetService,
): Promise<void> {
  const body = await readJsonBody(req);
  const email = typeof body.email === "string" ? body.email : "";

  await service.requestReset(email);

  sendJson(res, 200, {
    message: "If that email address is registered, a password reset link has been sent.",
  });
}

export async function handlePasswordResetConfirm(
  req: IncomingMessage,
  res: ServerResponse,
  service: PasswordResetService,
): Promise<void> {
  const body = await readJsonBody(req);
  const token = typeof body.token === "string" ? body.token : "";
  const newPassword = typeof body.newPassword === "string" ? body.newPassword : "";

  const result = await service.confirmReset(token, newPassword);

  if (result.status === "error") {
    sendJson(res, 400, { message: describeError(result.reason) });
    return;
  }

  sendJson(res, 200, { redirectTo: result.redirectTo });
}

function describeError(reason: string): string {
  switch (reason) {
    case "invalid_or_expired_token":
      return "This password reset link is invalid or has expired.";
    case "weak_password":
      return "Password does not meet the minimum strength requirement.";
    default:
      return "Unable to reset password.";
  }
}
