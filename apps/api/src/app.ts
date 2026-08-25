import {
  createSectorSchema,
  sectorIdSchema,
  sectorListResponseSchema,
  sectorResponseSchema,
  updateSectorSchema,
} from "@parking/contracts";
import express from "express";

import type { SectorRepository } from "./repositories/sectors.js";

function validationMessage(issues: { message: string }[]): string {
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

/** Creates the HTTP application with the sector persistence dependency injected. */
export function createApp({ sectors }: { sectors: SectorRepository }) {
  const app = express();

  app.disable("x-powered-by");
  app.use(express.json({ limit: "100kb" }));

  app.get("/health", (_request, response) => {
    response.json({ status: "ok" });
  });

  app.get("/v1/sectors", async (_request, response) => {
    try {
      response.json(sectorListResponseSchema.parse(await sectors.list()));
    } catch {
      response.status(500).json({
        error: {
          code: "SECTORS_QUERY_FAILED",
          message: "Nao foi possivel consultar os setores.",
        },
      });
    }
  });

  app.get("/v1/sectors/:id", async (request, response) => {
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

  app.post("/v1/sectors", async (request, response) => {
    const input = createSectorSchema.safeParse(request.body);

    if (!input.success) {
      response.status(400).json({
        error: {
          code: "INVALID_SECTOR",
          message: validationMessage(input.error.issues),
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
  });

  app.patch("/v1/sectors/:id", async (request, response) => {
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
          message: validationMessage(input.error.issues),
        },
      });
      return;
    }

    try {
      const result = await sectors.update(id.data, input.data);

      if (result.kind === "not_found") {
        response.status(404).json({
          error: { code: "SECTOR_NOT_FOUND", message: "Setor nao encontrado." },
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
  });

  app.delete("/v1/sectors/:id", async (request, response) => {
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
          error: { code: "SECTOR_NOT_FOUND", message: "Setor nao encontrado." },
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
  });

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
