import type { RequestHandler } from "express";
import type { User } from "@parking/contracts";

import { sendError } from "../http.js";
import type { UserRepository } from "../repositories/users.js";
import { toPublicUser } from "../repositories/users.js";
import { readTokenFromRequest, verifySession } from "./session.js";

declare global {
  namespace Express {
    interface Request {
      currentUser?: User;
    }
  }
}

export function createAuthMiddleware({
  users,
  sessionSecret,
}: {
  users: UserRepository;
  sessionSecret: string;
}) {
  const requireAuth: RequestHandler = async (request, response, next) => {
    const token = readTokenFromRequest(request);
    if (!token) {
      sendError(
        response,
        401,
        "UNAUTHENTICATED",
        "E necessario estar autenticado.",
      );
      return;
    }

    const session = verifySession(token, sessionSecret);
    if (!session) {
      sendError(response, 401, "UNAUTHENTICATED", "Sessao invalida ou expirada.");
      return;
    }

    const record = await users.findById(session.sub);
    if (!record) {
      sendError(response, 401, "UNAUTHENTICATED", "Sessao invalida ou expirada.");
      return;
    }

    request.currentUser = toPublicUser(record);
    next();
  };

  const requireAdmin: RequestHandler = (request, response, next) => {
    if (request.currentUser?.role !== "ADMIN") {
      sendError(
        response,
        403,
        "FORBIDDEN",
        "Apenas administradores podem acessar este recurso.",
      );
      return;
    }

    next();
  };

  return { requireAuth, requireAdmin };
}
