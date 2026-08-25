import assert from "node:assert/strict";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import test from "node:test";

import {
  apiErrorSchema,
  sessionResponseSchema,
  userListResponseSchema,
  userResponseSchema,
} from "@parking/contracts";
import type { Express } from "express";

import { hashPassword } from "./auth/password.js";
import { createApp } from "./app.js";
import type { SectorRepository } from "./repositories/sectors.js";
import { createMemoryUserRepository } from "./repositories/users.js";

const sessionSecret = "test-session-secret";

function createEmptySectorRepository(): SectorRepository {
  return {
    async list() {
      return { data: [] };
    },
    async findById() {
      return null;
    },
    async create(input) {
      return {
        id: crypto.randomUUID(),
        ...input,
        availableSpots: input.capacity,
      };
    },
    async update() {
      return { kind: "not_found" };
    },
    async delete() {
      return "not_found";
    },
  };
}

function createTestApp() {
  return createApp({
    sessionSecret,
    users: createMemoryUserRepository(),
    sectors: createEmptySectorRepository(),
  });
}

async function listen(app: Express): Promise<Server> {
  const server = app.listen(0);
  await new Promise<void>((resolve) => server.once("listening", resolve));
  return server;
}

function baseUrl(server: Server) {
  const { port } = server.address() as AddressInfo;
  return `http://127.0.0.1:${port}`;
}

function cookieHeader(response: Response) {
  return response.headers.getSetCookie().join("; ");
}

test("registers a USER, logs in and returns the current session", async (context) => {
  const server = await listen(createTestApp());
  context.after(() => server.close());
  const base = baseUrl(server);

  const registerResponse = await fetch(`${base}/v1/auth/register`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      name: "Rayane Souza",
      email: "  Rayane@Example.COM ",
      password: "senha1234",
    }),
  });

  assert.equal(registerResponse.status, 201);
  const registered = sessionResponseSchema.parse(await registerResponse.json());
  assert.equal(registered.data.user.email, "rayane@example.com");
  assert.equal(registered.data.user.role, "USER");
  assert.equal("passwordHash" in registered.data.user, false);

  const meResponse = await fetch(`${base}/v1/auth/me`, {
    headers: { cookie: cookieHeader(registerResponse) },
  });

  assert.equal(meResponse.status, 200);
  const me = userResponseSchema.parse(await meResponse.json());
  assert.equal(me.data.id, registered.data.user.id);

  const loginResponse = await fetch(`${base}/v1/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      email: "rayane@example.com",
      password: "senha1234",
    }),
  });

  assert.equal(loginResponse.status, 200);
  sessionResponseSchema.parse(await loginResponse.json());
});

test("rejects empty name, short password and duplicate email", async (context) => {
  const server = await listen(createTestApp());
  context.after(() => server.close());
  const base = baseUrl(server);

  const emptyName = await fetch(`${base}/v1/auth/register`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      name: "  ",
      email: "user@example.com",
      password: "senha1234",
    }),
  });
  assert.equal(emptyName.status, 400);
  apiErrorSchema.parse(await emptyName.json());

  const shortPassword = await fetch(`${base}/v1/auth/register`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      name: "Motorista",
      email: "user@example.com",
      password: "123",
    }),
  });
  assert.equal(shortPassword.status, 400);

  const created = await fetch(`${base}/v1/auth/register`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      name: "Motorista",
      email: "user@example.com",
      password: "senha1234",
    }),
  });
  assert.equal(created.status, 201);

  const duplicate = await fetch(`${base}/v1/auth/register`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      name: "Outro",
      email: "USER@example.com",
      password: "senha1234",
    }),
  });
  assert.equal(duplicate.status, 409);
  const error = apiErrorSchema.parse(await duplicate.json());
  assert.equal(error.error.code, "EMAIL_ALREADY_EXISTS");
});

test("rejects invalid credentials and anonymous access", async (context) => {
  const server = await listen(createTestApp());
  context.after(() => server.close());
  const base = baseUrl(server);

  await fetch(`${base}/v1/auth/register`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      name: "Motorista",
      email: "user@example.com",
      password: "senha1234",
    }),
  });

  const invalid = await fetch(`${base}/v1/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      email: "user@example.com",
      password: "errada999",
    }),
  });
  assert.equal(invalid.status, 401);
  const error = apiErrorSchema.parse(await invalid.json());
  assert.equal(error.error.code, "INVALID_CREDENTIALS");

  const anonymous = await fetch(`${base}/v1/auth/me`);
  assert.equal(anonymous.status, 401);
});

test("blocks USER on admin routes and allows ADMIN", async (context) => {
  const server = await listen(createTestApp());
  context.after(() => server.close());
  const base = baseUrl(server);

  const driverResponse = await fetch(`${base}/v1/auth/register`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      name: "Motorista",
      email: "motorista@example.com",
      password: "senha1234",
    }),
  });
  const driverCookie = cookieHeader(driverResponse);

  const forbidden = await fetch(`${base}/v1/admin/session`, {
    headers: { cookie: driverCookie },
  });
  assert.equal(forbidden.status, 403);
  const forbiddenBody = apiErrorSchema.parse(await forbidden.json());
  assert.equal(forbiddenBody.error.code, "FORBIDDEN");

  const usersForbidden = await fetch(`${base}/v1/users`, {
    headers: { cookie: driverCookie },
  });
  assert.equal(usersForbidden.status, 403);

  const adminId = "11111111-1111-4111-8111-111111111111";
  const now = new Date();
  const adminApp = createApp({
    sessionSecret,
    sectors: createEmptySectorRepository(),
    users: createMemoryUserRepository([
      {
        id: adminId,
        name: "Administrador",
        email: "admin@example.com",
        passwordHash: await hashPassword("admin1234"),
        role: "ADMIN",
        createdAt: now,
        updatedAt: now,
      },
    ]),
  });
  const adminServer = await listen(adminApp);
  context.after(() => adminServer.close());
  const adminBase = baseUrl(adminServer);

  const login = await fetch(`${adminBase}/v1/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      email: "admin@example.com",
      password: "admin1234",
    }),
  });
  assert.equal(login.status, 200);
  const adminCookie = cookieHeader(login);

  const allowed = await fetch(`${adminBase}/v1/admin/session`, {
    headers: { cookie: adminCookie },
  });
  assert.equal(allowed.status, 200);
  sessionResponseSchema.parse(await allowed.json());

  const list = await fetch(`${adminBase}/v1/users`, {
    headers: { cookie: adminCookie },
  });
  assert.equal(list.status, 200);
  const listed = userListResponseSchema.parse(await list.json());
  assert.equal(listed.data.length, 1);
  assert.equal(listed.data[0]?.role, "ADMIN");
});
