import {
  cancelReservationResponseSchema,
  createReservationSchema,
  createSectorSchema,
  loginRequestSchema,
  registerUserRequestSchema,
  reservationEventListResponseSchema,
  reservationIdSchema,
  reservationListResponseSchema,
  reservationResponseSchema,
  sectorIdSchema,
  sectorListResponseSchema,
  sectorResponseSchema,
  sessionResponseSchema,
  updateSectorSchema,
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
import type { SectorRepository } from "./repositories/sectors.js";
import type { ReservationRepository } from "./repositories/reservations.js";
import type { UserRepository } from "./repositories/users.js";
import { toPublicUser } from "./repositories/users.js";

function authValidationMessage(error: ZodError): string {
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

function reservationValidationMessage(issues: { message: string }[]): string {
  return issues[0]?.message ?? "Dados da reserva invalidos.";
}

function sectorValidationMessage(issues: { message: string }[]): string {
  return issues[0]?.message ?? "Dados do setor invalidos.";
}

function isBodyParserError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "type" in error &&
    error.type === "entity.parse.failed"
  );
}

function sessionBody(user: User) {
  return sessionResponseSchema.parse({ data: { user } });
}

/** Creates the HTTP application with authentication and persistence injected. */
export function createApp({
  sectors,
  users,
  reservations,
  sessionSecret,
}: {
  sectors: SectorRepository;
  users: UserRepository;
  reservations: ReservationRepository;
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
      sendError(
        response,
        400,
        "VALIDATION_ERROR",
        authValidationMessage(parsed.error),
      );
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
      sendError(
        response,
        400,
        "VALIDATION_ERROR",
        authValidationMessage(parsed.error),
      );
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

  app.get("/v1/sectors", requireAuth, async (_request, response) => {
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

  app.get("/v1/sectors/:id", requireAuth, async (request, response) => {
    const id = sectorIdSchema.safeParse(request.params.id);

    if (!id.success) {
      response.status(400).json({
        error: {
          code: "INVALID_SECTOR_ID",
          message: id.error.issues[0]?.message,
        },
      });
      return;
    }

    try {
      const sector = await sectors.findById(id.data);

      if (!sector) {
        response.status(404).json({
          error: { code: "SECTOR_NOT_FOUND", message: "Setor nao encontrado." },
        });
        return;
      }

      response.json(sectorResponseSchema.parse({ data: sector }));
    } catch {
      response.status(500).json({
        error: {
          code: "SECTOR_QUERY_FAILED",
          message: "Nao foi possivel consultar o setor.",
        },
      });
    }
  });

  app.post(
    "/v1/sectors",
    requireAuth,
    requireAdmin,
    async (request, response) => {
      const input = createSectorSchema.safeParse(request.body);

      if (!input.success) {
        response.status(400).json({
          error: {
            code: "INVALID_SECTOR",
            message: sectorValidationMessage(input.error.issues),
          },
        });
        return;
      }

      try {
        const sector = await sectors.create(input.data);
        response.status(201).json(sectorResponseSchema.parse({ data: sector }));
      } catch {
        response.status(500).json({
          error: {
            code: "SECTOR_CREATE_FAILED",
            message: "Nao foi possivel cadastrar o setor.",
          },
        });
      }
    },
  );

  app.patch(
    "/v1/sectors/:id",
    requireAuth,
    requireAdmin,
    async (request, response) => {
      const id = sectorIdSchema.safeParse(request.params.id);
      const input = updateSectorSchema.safeParse(request.body);

      if (!id.success) {
        response.status(400).json({
          error: {
            code: "INVALID_SECTOR_ID",
            message: id.error.issues[0]?.message,
          },
        });
        return;
      }

      if (!input.success) {
        response.status(400).json({
          error: {
            code: "INVALID_SECTOR",
            message: sectorValidationMessage(input.error.issues),
          },
        });
        return;
      }

      try {
        const result = await sectors.update(id.data, input.data);

        if (result.kind === "not_found") {
          response.status(404).json({
            error: {
              code: "SECTOR_NOT_FOUND",
              message: "Setor nao encontrado.",
            },
          });
          return;
        }

        if (result.kind === "capacity_conflict") {
          response.status(409).json({
            error: {
              code: "SECTOR_CAPACITY_CONFLICT",
              message: "Capacidade nao pode ser menor que as vagas ocupadas.",
            },
          });
          return;
        }

        response.json(sectorResponseSchema.parse({ data: result.sector }));
      } catch {
        response.status(500).json({
          error: {
            code: "SECTOR_UPDATE_FAILED",
            message: "Nao foi possivel atualizar o setor.",
          },
        });
      }
    },
  );

  app.delete(
    "/v1/sectors/:id",
    requireAuth,
    requireAdmin,
    async (request, response) => {
      const id = sectorIdSchema.safeParse(request.params.id);

      if (!id.success) {
        response.status(400).json({
          error: {
            code: "INVALID_SECTOR_ID",
            message: id.error.issues[0]?.message,
          },
        });
        return;
      }

      try {
        const result = await sectors.delete(id.data);

        if (result === "not_found") {
          response.status(404).json({
            error: {
              code: "SECTOR_NOT_FOUND",
              message: "Setor nao encontrado.",
            },
          });
          return;
        }

        if (result === "in_use") {
          response.status(409).json({
            error: {
              code: "SECTOR_IN_USE",
              message: "Setor possui reservas ou entradas na lista de espera.",
            },
          });
          return;
        }

        response.status(204).send();
      } catch {
        response.status(500).json({
          error: {
            code: "SECTOR_DELETE_FAILED",
            message: "Nao foi possivel excluir o setor.",
          },
        });
      }
    },
  );

  app.get("/v1/reservations", requireAuth, async (request, response) => {
    if (!request.currentUser) {
      sendError(
        response,
        401,
        "UNAUTHENTICATED",
        "E necessario estar autenticado.",
      );
      return;
    }

    try {
      const data = await reservations.list(request.currentUser);
      response.json(reservationListResponseSchema.parse({ data }));
    } catch {
      sendError(
        response,
        500,
        "RESERVATIONS_QUERY_FAILED",
        "Nao foi possivel consultar as reservas.",
      );
    }
  });

  app.post("/v1/reservations", requireAuth, async (request, response) => {
    if (!request.currentUser) {
      sendError(
        response,
        401,
        "UNAUTHENTICATED",
        "E necessario estar autenticado.",
      );
      return;
    }

    const input = createReservationSchema.safeParse(request.body);
    if (!input.success) {
      sendError(
        response,
        400,
        "INVALID_RESERVATION",
        reservationValidationMessage(input.error.issues),
      );
      return;
    }

    try {
      const result = await reservations.create(input.data, request.currentUser);

      if (result.kind === "sector_not_found") {
        sendError(response, 404, "SECTOR_NOT_FOUND", "Setor nao encontrado.");
        return;
      }

      if (result.kind === "sector_full") {
        sendError(
          response,
          409,
          "SECTOR_FULL",
          "Setor sem cota disponivel.",
        );
        return;
      }

      if (result.kind === "plate_active") {
        sendError(
          response,
          409,
          "PLATE_ALREADY_ACTIVE",
          "Esta placa ja possui uma reserva ativa.",
        );
        return;
      }

      response
        .status(201)
        .json(reservationResponseSchema.parse({ data: result.reservation }));
    } catch {
      sendError(
        response,
        500,
        "RESERVATION_CREATE_FAILED",
        "Nao foi possivel criar a reserva.",
      );
    }
  });

  app.get("/v1/reservations/:id", requireAuth, async (request, response) => {
    if (!request.currentUser) {
      sendError(
        response,
        401,
        "UNAUTHENTICATED",
        "E necessario estar autenticado.",
      );
      return;
    }

    const id = reservationIdSchema.safeParse(request.params.id);
    if (!id.success) {
      sendError(
        response,
        400,
        "INVALID_RESERVATION_ID",
        id.error.issues[0]?.message ?? "Identificador de reserva invalido.",
      );
      return;
    }

    try {
      const result = await reservations.findById(id.data, request.currentUser);
      if (result.kind === "not_found") {
        sendError(response, 404, "RESERVATION_NOT_FOUND", "Reserva nao encontrada.");
        return;
      }

      response.json(
        reservationResponseSchema.parse({ data: result.reservation }),
      );
    } catch {
      sendError(
        response,
        500,
        "RESERVATION_QUERY_FAILED",
        "Nao foi possivel consultar a reserva.",
      );
    }
  });

  app.post(
    "/v1/reservations/:id/cancel",
    requireAuth,
    async (request, response) => {
      if (!request.currentUser) {
        sendError(
          response,
          401,
          "UNAUTHENTICATED",
          "E necessario estar autenticado.",
        );
        return;
      }

      const id = reservationIdSchema.safeParse(request.params.id);
      if (!id.success) {
        sendError(
          response,
          400,
          "INVALID_RESERVATION_ID",
          id.error.issues[0]?.message ?? "Identificador de reserva invalido.",
        );
        return;
      }

      try {
        const result = await reservations.cancel(id.data, request.currentUser);

        if (result.kind === "not_found") {
          sendError(
            response,
            404,
            "RESERVATION_NOT_FOUND",
            "Reserva nao encontrada.",
          );
          return;
        }

        if (result.kind === "not_active") {
          sendError(
            response,
            409,
            "RESERVATION_NOT_ACTIVE",
            "Somente reservas ativas podem ser canceladas.",
          );
          return;
        }

        response.json(
          cancelReservationResponseSchema.parse({
            data: {
              reservation: result.reservation,
              promoted: result.promoted,
            },
          }),
        );
      } catch {
        sendError(
          response,
          500,
          "RESERVATION_CANCEL_FAILED",
          "Nao foi possivel cancelar a reserva.",
        );
      }
    },
  );

  app.get(
    "/v1/reservations/:id/events",
    requireAuth,
    async (request, response) => {
      if (!request.currentUser) {
        sendError(
          response,
          401,
          "UNAUTHENTICATED",
          "E necessario estar autenticado.",
        );
        return;
      }

      const id = reservationIdSchema.safeParse(request.params.id);
      if (!id.success) {
        sendError(
          response,
          400,
          "INVALID_RESERVATION_ID",
          id.error.issues[0]?.message ?? "Identificador de reserva invalido.",
        );
        return;
      }

      try {
        const result = await reservations.listEvents(
          id.data,
          request.currentUser,
        );

        if (result.kind === "not_found") {
          sendError(
            response,
            404,
            "RESERVATION_NOT_FOUND",
            "Reserva nao encontrada.",
          );
          return;
        }

        response.json(
          reservationEventListResponseSchema.parse({ data: result.events }),
        );
      } catch {
        sendError(
          response,
          500,
          "RESERVATION_EVENTS_QUERY_FAILED",
          "Nao foi possivel consultar o historico da reserva.",
        );
      }
    },
  );

  app.use(
    (
      error: unknown,
      _request: express.Request,
      response: express.Response,
      next: express.NextFunction,
    ) => {
      if (isBodyParserError(error)) {
        response.status(400).json({
          error: { code: "INVALID_JSON", message: "Corpo JSON invalido." },
        });
        return;
      }

      next(error);
    },
  );

  return app;
}
