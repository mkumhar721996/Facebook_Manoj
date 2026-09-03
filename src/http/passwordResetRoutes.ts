import type { IncomingMessage, ServerResponse } from "node:http";

import type { PasswordResetService } from "../services/passwordResetService.ts";

const MAX_BODY_SIZE_BYTES = 10 * 1024;

class PayloadTooLargeError extends Error {}

function readJsonBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    let raw = "";
    let tooLarge = false;

    req.on("data", (chunk) => {
      if (tooLarge) {
        return;
      }
      raw += chunk;
      if (raw.length > MAX_BODY_SIZE_BYTES) {
        tooLarge = true;
        raw = "";
        req.pause();
        reject(new PayloadTooLargeError("Request body exceeds the maximum allowed size."));
      }
    });
    req.on("end", () => {
      if (tooLarge) {
        return;
      }
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
    req.on("error", (error) => {
      if (!tooLarge) {
        reject(error);
      }
    });
  });
}

async function readJsonBodyOrRespond(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<Record<string, unknown> | undefined> {
  try {
    return await readJsonBody(req);
  } catch (error) {
    if (error instanceof PayloadTooLargeError) {
      sendJson(res, 413, { message: "Request body is too large." });
      req.destroy();
      return undefined;
    }
    throw error;
  }
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
  const body = await readJsonBodyOrRespond(req, res);
  if (!body) {
    return;
  }
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
  const body = await readJsonBodyOrRespond(req, res);
  if (!body) {
    return;
  }
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
