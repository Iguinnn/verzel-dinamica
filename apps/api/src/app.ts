import {
  loginRequestSchema,
  registerUserRequestSchema,
  sectorListResponseSchema,
  sessionResponseSchema,
  userListResponseSchema,
  userResponseSchema,
  type User,
} from "@parking/contracts";
import type { ZodError } from "zod";
import express from "express";

import { createAuthMiddleware } from "./auth/middleware.js";
import { hashPassword, verifyPassword } from "./auth/password.js";
import {
  clearSessionCookie,
  sessionCookie,
  signSession,
} from "./auth/session.js";
import { sendError } from "./http.js";
import type { SectorReader } from "./repositories/sectors.js";
import type { UserRepository } from "./repositories/users.js";
import { toPublicUser } from "./repositories/users.js";

function validationMessage(error: ZodError): string {
  const field = error.issues[0]?.path[0];

  if (field === "password") {
    return "A senha deve ter no minimo 8 caracteres.";
  }
  if (field === "email") {
    return "Informe um e-mail valido.";
  }
  if (field === "name") {
    return "O nome e obrigatorio.";
  }

  return "Dados invalidos.";
}

function sessionBody(user: User) {
  return sessionResponseSchema.parse({ data: { user } });
}

export function createApp({
  sectors,
  users,
  sessionSecret,
}: {
  sectors: SectorReader;
  users: UserRepository;
  sessionSecret: string;
}) {
  const app = express();
  const { requireAuth, requireAdmin } = createAuthMiddleware({
    users,
    sessionSecret,
  });

  app.disable("x-powered-by");
  app.use(express.json({ limit: "100kb" }));

  app.get("/health", (_request, response) => {
    response.json({ status: "ok" });
  });

  app.post("/v1/auth/register", async (request, response) => {
    const parsed = registerUserRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      sendError(response, 400, "VALIDATION_ERROR", validationMessage(parsed.error));
      return;
    }

    const { name, email, password } = parsed.data;

    if (await users.findByEmail(email)) {
      sendError(
        response,
        409,
        "EMAIL_ALREADY_EXISTS",
        "Ja existe um usuario com este e-mail.",
      );
      return;
    }

    try {
      const record = await users.create({
        name,
        email,
        passwordHash: await hashPassword(password),
        role: "USER",
      });
      const user = toPublicUser(record);
      const token = signSession(user.id, sessionSecret);

      response.setHeader("Set-Cookie", sessionCookie(token));
      response.status(201).json(sessionBody(user));
    } catch (error) {
      if (
        error instanceof Error &&
        "code" in error &&
        error.code === "23505"
      ) {
        sendError(
          response,
          409,
          "EMAIL_ALREADY_EXISTS",
          "Ja existe um usuario com este e-mail.",
        );
        return;
      }

      sendError(
        response,
        500,
        "USER_CREATE_FAILED",
        "Nao foi possivel criar o usuario.",
      );
    }
  });

  app.post("/v1/auth/login", async (request, response) => {
    const parsed = loginRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      sendError(response, 400, "VALIDATION_ERROR", validationMessage(parsed.error));
      return;
    }

    const { email, password } = parsed.data;
    const record = await users.findByEmail(email);
    const matches =
      record !== undefined && (await verifyPassword(password, record.passwordHash));

    if (!record || !matches) {
      sendError(
        response,
        401,
        "INVALID_CREDENTIALS",
        "E-mail ou senha invalidos.",
      );
      return;
    }

    const user = toPublicUser(record);
    const token = signSession(user.id, sessionSecret);

    response.setHeader("Set-Cookie", sessionCookie(token));
    response.json(sessionBody(user));
  });

  app.post("/v1/auth/logout", (_request, response) => {
    response.setHeader("Set-Cookie", clearSessionCookie());
    response.status(204).send();
  });

  app.get("/v1/auth/me", requireAuth, (request, response) => {
    if (!request.currentUser) {
      sendError(
        response,
        401,
        "UNAUTHENTICATED",
        "E necessario estar autenticado.",
      );
      return;
    }

    response.json(userResponseSchema.parse({ data: request.currentUser }));
  });

  app.get("/v1/users", requireAuth, requireAdmin, async (_request, response) => {
    try {
      const data = (await users.list()).map(toPublicUser);
      response.json(userListResponseSchema.parse({ data }));
    } catch {
      sendError(
        response,
        500,
        "USERS_QUERY_FAILED",
        "Nao foi possivel consultar os usuarios.",
      );
    }
  });

  app.get("/v1/admin/session", requireAuth, requireAdmin, (request, response) => {
    if (!request.currentUser) {
      sendError(
        response,
        401,
        "UNAUTHENTICATED",
        "E necessario estar autenticado.",
      );
      return;
    }

    response.json(sessionBody(request.currentUser));
  });

  app.get("/v1/sectors", async (_request, response) => {
    try {
      response.json(sectorListResponseSchema.parse(await sectors.list()));
    } catch {
      sendError(
        response,
        500,
        "SECTORS_QUERY_FAILED",
        "Nao foi possivel consultar os setores.",
      );
    }
  });

  return app;
}
