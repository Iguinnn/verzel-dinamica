import { cookies } from "next/headers";

import {
  apiErrorSchema,
  loginRequestSchema,
  registerUserRequestSchema,
  sessionResponseSchema,
  userListResponseSchema,
  userResponseSchema,
  type LoginRequest,
  type RegisterUserRequest,
  type SessionResponse,
  type User,
  type UserListResponse,
  type UserResponse,
} from "@parking/contracts";

export const SESSION_COOKIE = "parking_session";
const SESSION_MAX_AGE = 60 * 60 * 12;

const mockDriver: User = {
  id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  name: "Motorista Demo",
  email: "motorista@estacionamento.local",
  role: "USER",
  createdAt: "2026-08-25T12:00:00.000Z",
  updatedAt: "2026-08-25T12:00:00.000Z",
};

const mockAdmin: User = {
  id: "b2c3d4e5-f6a7-8901-bcde-f12345678901",
  name: "Administrador",
  email: "admin@estacionamento.local",
  role: "ADMIN",
  createdAt: "2026-08-25T12:00:00.000Z",
  updatedAt: "2026-08-25T12:00:00.000Z",
};

const mockPasswords: Record<string, string> = {
  [mockAdmin.email]: "admin1234",
  [mockDriver.email]: "motorista1234",
};

function apiUrl() {
  return process.env.API_URL ?? "http://localhost:3333";
}

function isMock() {
  return (process.env.BACKEND_MODE ?? "mock") === "mock";
}

function parseApiError(payload: unknown, status: number): never {
  const parsed = apiErrorSchema.safeParse(payload);
  const message = parsed.success
    ? parsed.data.error.message
    : `Auth API returned ${status}`;
  throw new Error(message);
}

async function parseJson(response: Response) {
  return response.json() as Promise<unknown>;
}

function mockUsers() {
  return [mockAdmin, mockDriver];
}

function mockUserByEmail(email: string) {
  return mockUsers().find((user) => user.email === email);
}

function mockToken(userId: string) {
  return `mock.${userId}`;
}

function tokenFromSetCookies(headers: string[]) {
  for (const header of headers) {
    const pair = header.split(";")[0] ?? "";
    const separator = pair.indexOf("=");
    if (separator === -1) {
      continue;
    }

    const name = pair.slice(0, separator).trim();
    const value = pair.slice(separator + 1).trim();
    if (name === SESSION_COOKIE) {
      return decodeURIComponent(value);
    }
  }

  return undefined;
}

function tokenFromCookieHeader(cookieHeader?: string | null) {
  if (!cookieHeader) {
    return undefined;
  }

  for (const part of cookieHeader.split(";")) {
    const separator = part.indexOf("=");
    if (separator === -1) {
      continue;
    }

    const name = part.slice(0, separator).trim();
    const value = part.slice(separator + 1).trim();
    if (name === SESSION_COOKIE) {
      return decodeURIComponent(value);
    }
  }

  return undefined;
}

export async function persistSessionToken(token: string) {
  const jar = await cookies();
  jar.set({
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function clearSessionToken() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

export async function readSessionToken() {
  const jar = await cookies();
  return jar.get(SESSION_COOKIE)?.value;
}

export async function registerUser(
  input: RegisterUserRequest,
): Promise<{ session: SessionResponse; token: string }> {
  const body = registerUserRequestSchema.parse(input);

  if (isMock()) {
    const user: User = {
      ...mockDriver,
      name: body.name,
      email: body.email,
    };
    return {
      session: sessionResponseSchema.parse({ data: { user } }),
      token: mockToken(user.id),
    };
  }

  const response = await fetch(`${apiUrl()}/v1/auth/register`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const payload = await parseJson(response);

  if (!response.ok) {
    parseApiError(payload, response.status);
  }

  const token = tokenFromSetCookies(response.headers.getSetCookie());
  if (!token) {
    throw new Error("Session cookie was not returned.");
  }

  return {
    session: sessionResponseSchema.parse(payload),
    token,
  };
}

export async function login(
  input: LoginRequest,
): Promise<{ session: SessionResponse; token: string }> {
  const body = loginRequestSchema.parse(input);

  if (isMock()) {
    const user = mockUserByEmail(body.email);
    if (!user || mockPasswords[user.email] !== body.password) {
      throw new Error("Invalid email or password.");
    }

    return {
      session: sessionResponseSchema.parse({ data: { user } }),
      token: mockToken(user.id),
    };
  }

  const response = await fetch(`${apiUrl()}/v1/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const payload = await parseJson(response);

  if (!response.ok) {
    parseApiError(payload, response.status);
  }

  const token = tokenFromSetCookies(response.headers.getSetCookie());
  if (!token) {
    throw new Error("Session cookie was not returned.");
  }

  return {
    session: sessionResponseSchema.parse(payload),
    token,
  };
}

export async function currentUser(
  cookieHeader?: string | null,
): Promise<UserResponse> {
  const token = tokenFromCookieHeader(cookieHeader);

  if (isMock()) {
    if (!token?.startsWith("mock.")) {
      throw new Error("Unauthenticated.");
    }

    const userId = token.slice("mock.".length);
    const user = mockUsers().find((item) => item.id === userId);
    if (!user) {
      throw new Error("Unauthenticated.");
    }

    return userResponseSchema.parse({ data: user });
  }

  const response = await fetch(`${apiUrl()}/v1/auth/me`, {
    headers: token ? { cookie: `${SESSION_COOKIE}=${token}` } : undefined,
    cache: "no-store",
  });
  const payload = await parseJson(response);

  if (!response.ok) {
    parseApiError(payload, response.status);
  }

  return userResponseSchema.parse(payload);
}

export async function listUsers(
  cookieHeader?: string | null,
): Promise<UserListResponse> {
  if (isMock()) {
    const token = tokenFromCookieHeader(cookieHeader);
    const { data: actor } = await currentUser(
      token ? `${SESSION_COOKIE}=${token}` : cookieHeader,
    );
    if (actor.role !== "ADMIN") {
      throw new Error("Only administrators can access this resource.");
    }

    return userListResponseSchema.parse({ data: mockUsers() });
  }

  const response = await fetch(`${apiUrl()}/v1/users`, {
    headers: cookieHeader ? { cookie: cookieHeader } : undefined,
    cache: "no-store",
  });
  const payload = await parseJson(response);

  if (!response.ok) {
    parseApiError(payload, response.status);
  }

  return userListResponseSchema.parse(payload);
}
