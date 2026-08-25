import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import test from "node:test";

import { sectorListResponseSchema } from "@parking/contracts";

import { createApp } from "./app.js";
import { createMemoryUserRepository } from "./repositories/users.js";

test("serves health and contract-valid sectors", async (context) => {
  const app = createApp({
    sessionSecret: "test-session-secret",
    users: createMemoryUserRepository(),
    sectors: {
      async list() {
        return {
          data: [
            {
              id: "ed31bd55-cfb5-488e-bf63-14687db7390b",
              name: "Setor Central",
              location: "Entrada principal",
              capacity: 12,
              availableSpots: 4,
              hourlyRate: 8,
            },
          ],
        };
      },
    },
  });
  const server = app.listen(0);
  context.after(() => server.close());

  await new Promise<void>((resolve) => server.once("listening", resolve));
  const { port } = server.address() as AddressInfo;

  const healthResponse = await fetch(`http://127.0.0.1:${port}/health`);
  assert.deepEqual(await healthResponse.json(), { status: "ok" });

  const sectorsResponse = await fetch(`http://127.0.0.1:${port}/v1/sectors`);
  assert.equal(sectorsResponse.status, 200);
  sectorListResponseSchema.parse(await sectorsResponse.json());
});
