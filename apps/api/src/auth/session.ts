import { createHmac, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE = "parking_session";
const SESSION_TTL_SECONDS = 60 * 60 * 12;

type SessionPayload = {
  sub: string;
  exp: number;
};

export function signSession(userId: string, secret: string): string {
  const payload: SessionPayload = {
    sub: userId,
    exp: Date.now() + SESSION_TTL_SECONDS * 1000,
  };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = createHmac("sha256", secret).update(body).digest("base64url");
  return `${body}.${signature}`;
}

export function verifySession(
  token: string,
  secret: string,
): SessionPayload | undefined {
  const [body, signature] = token.split(".");

  if (!body || !signature) {
    return undefined;
  }

  const expected = createHmac("sha256", secret).update(body).digest("base64url");
  const received = Buffer.from(signature);
  const computed = Buffer.from(expected);

  if (received.length !== computed.length || !timingSafeEqual(received, computed)) {
    return undefined;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(body, "base64url").toString("utf8"),
    ) as SessionPayload;

    if (!payload.sub || payload.exp <= Date.now()) {
      return undefined;
    }

    return payload;
  } catch {
    return undefined;
  }
}

export function sessionCookie(token: string): string {
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_TTL_SECONDS}`;
}

export function clearSessionCookie(): string {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

export function readCookie(
  header: string | undefined,
  name: string,
): string | undefined {
  if (!header) {
    return undefined;
  }

  for (const part of header.split(";")) {
    const separator = part.indexOf("=");

    if (separator === -1) {
      continue;
    }

    const key = part.slice(0, separator).trim();
    const value = part.slice(separator + 1).trim();

    if (key === name) {
      return decodeURIComponent(value);
    }
  }

  return undefined;
}

export function readTokenFromRequest(request: {
  headers: { cookie?: string; authorization?: string };
}): string | undefined {
  const bearer = request.headers.authorization;
  if (bearer?.startsWith("Bearer ")) {
    return bearer.slice("Bearer ".length).trim() || undefined;
  }

  return readCookie(request.headers.cookie, SESSION_COOKIE);
}
