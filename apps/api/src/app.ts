import { sectorListResponseSchema } from "@parking/contracts";
import express from "express";

import type { SectorReader } from "./repositories/sectors.js";

export function createApp({ sectors }: { sectors: SectorReader }) {
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

  return app;
}
