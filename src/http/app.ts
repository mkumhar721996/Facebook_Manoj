import { createServer, type Server } from "node:http";

import type { PasswordResetService } from "../services/passwordResetService.ts";
import { handlePasswordResetConfirm, handlePasswordResetRequest } from "./passwordResetRoutes.ts";

function withErrorHandling(
  handler: () => Promise<void>,
  res: import("node:http").ServerResponse,
): void {
  handler().catch((error) => {
    res.writeHead(500, { "content-type": "application/json" });
    res.end(JSON.stringify({ message: "Internal server error" }));
    console.error(error);
  });
}

export function createApp(service: PasswordResetService): Server {
  return createServer((req, res) => {
    if (req.method === "POST" && req.url === "/password-reset/request") {
      withErrorHandling(() => handlePasswordResetRequest(req, res, service), res);
      return;
    }

    if (req.method === "POST" && req.url === "/password-reset/confirm") {
      withErrorHandling(() => handlePasswordResetConfirm(req, res, service), res);
      return;
    }

    res.writeHead(404, { "content-type": "application/json" });
    res.end(JSON.stringify({ message: "Not found" }));
  });
}
