import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const DEFAULT_EXPIRY_SECONDS = 3600;

export interface JwtPayload {
  sub: number;
  email: string;
  iat?: number;
  exp?: number;
}

// Resolved once per process: a fixed, hardcoded secret would let anyone who
// reads the source code forge tokens. When JWT_SECRET isn't configured, fall
// back to a random secret generated at startup (tokens won't survive a
// restart, which is acceptable for a single dev/test process but not for a
// multi-instance production deployment where JWT_SECRET must be set).
function resolveSecret(): string {
  if (process.env.JWT_SECRET) {
    return process.env.JWT_SECRET;
  }
  console.warn(
    "JWT_SECRET is not set; using a random secret generated for this process. " +
      "Tokens will be invalidated on restart and won't be valid across multiple instances. " +
      "Set JWT_SECRET before deploying to production.",
  );
  return randomBytes(32).toString("hex");
}

const SECRET = resolveSecret();

function getSecret(): string {
  return SECRET;
}

function base64url(input: string): string {
  return Buffer.from(input, "utf8").toString("base64url");
}

function sign(data: string): string {
  return createHmac("sha256", getSecret()).update(data).digest("base64url");
}

export function signToken(payload: Omit<JwtPayload, "iat" | "exp">, expiresInSeconds = DEFAULT_EXPIRY_SECONDS): string {
  const header = { alg: "HS256", typ: "JWT" };
  const nowSeconds = Math.floor(Date.now() / 1000);
  const fullPayload: JwtPayload = {
    ...payload,
    iat: nowSeconds,
    exp: nowSeconds + expiresInSeconds,
  };
  const encodedHeader = base64url(JSON.stringify(header));
  const encodedPayload = base64url(JSON.stringify(fullPayload));
  const signature = sign(`${encodedHeader}.${encodedPayload}`);
  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

export function verifyToken(token: string): JwtPayload | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [encodedHeader, encodedPayload, signature] = parts;

  const expectedSignature = sign(`${encodedHeader}.${encodedPayload}`);
  const expectedBuffer = Buffer.from(expectedSignature);
  const actualBuffer = Buffer.from(signature);
  if (expectedBuffer.length !== actualBuffer.length || !timingSafeEqual(expectedBuffer, actualBuffer)) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")) as JwtPayload;
    if (typeof payload.exp === "number" && payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}
