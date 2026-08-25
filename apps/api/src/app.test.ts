import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import test from "node:test";

import {
  apiErrorSchema,
  sectorListResponseSchema,
  sectorResponseSchema,
  type Sector,
} from "@parking/contracts";

import { sessionCookie, signSession } from "./auth/session.js";
import { createApp } from "./app.js";
import { createMemoryUserRepository } from "./repositories/users.js";
import { createMemoryReservationRepository } from "./repositories/reservations.js";
import type { SectorRepository } from "./repositories/sectors.js";
import type { WaitlistRepository } from "./repositories/waitlist.js";

const sessionSecret = "test-session-secret";
const adminId = "11111111-1111-4111-8111-111111111111";
const driverId = "22222222-2222-4222-8222-222222222222";

const initialSector: Sector = {
  id: "ed31bd55-cfb5-488e-bf63-14687db7390b",
  name: "Setor Central",
  location: "Entrada principal",
  capacity: 12,
  availableSpots: 4,
  hourlyRate: 8,
};

function createFakeRepository(): SectorRepository {
  let storedSectors = [initialSector];

  return {
    async list() {
      return { data: storedSectors };
    },
    async findById(id) {
      return storedSectors.find((sector) => sector.id === id) ?? null;
    },
    async create(input) {
      const sector = {
        id: "bf7eafac-0228-4308-8dbc-1d5fb39ecf6b",
        ...input,
        availableSpots: input.capacity,
      };
      storedSectors = [...storedSectors, sector];
      return sector;
    },
    async update(id, input) {
      const current = storedSectors.find((sector) => sector.id === id);

      if (!current) {
        return { kind: "not_found" };
      }

      const occupiedSpots = current.capacity - current.availableSpots;

      if (input.capacity !== undefined && input.capacity < occupiedSpots) {
        return { kind: "capacity_conflict" };
      }

      const sector = {
        ...current,
        ...input,
        availableSpots:
          input.capacity === undefined
            ? current.availableSpots
            : input.capacity - occupiedSpots,
      };
      storedSectors = storedSectors.map((item) =>
        item.id === id ? sector : item,
      );
      return { kind: "updated", sector };
    },
    async delete(id) {
      const exists = storedSectors.some((sector) => sector.id === id);

      if (!exists) {
        return "not_found";
      }

      storedSectors = storedSectors.filter((sector) => sector.id !== id);
      return "deleted";
    },
  };
}

function createEmptyWaitlistRepository(): WaitlistRepository {
  return {
    async join() {
      return { kind: "sector_not_found" };
    },
    async list() {
      return { kind: "sector_not_found" };
    },
    async leave() {
      return "not_found";
    },
  };
}

function cookieFor(userId: string) {
  return sessionCookie(signSession(userId, sessionSecret)).split(";", 1)[0] ?? "";
}

async function startApp(repository: SectorRepository) {
  const now = new Date();
  const users = createMemoryUserRepository([
    {
      id: adminId,
      name: "Administrador",
      email: "admin@example.com",
      passwordHash: "unused",
      role: "ADMIN",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: driverId,
      name: "Motorista",
      email: "driver@example.com",
      passwordHash: "unused",
      role: "USER",
      createdAt: now,
      updatedAt: now,
    },
  ]);
  const server = createApp({
    sectors: repository,
    users,
    reservations: createMemoryReservationRepository(),
    waitlist: createEmptyWaitlistRepository(),
    sessionSecret,
  }).listen(0);
  await new Promise<void>((resolve) => server.once("listening", resolve));
  const { port } = server.address() as AddressInfo;
  return {
    server,
    baseUrl: `http://127.0.0.1:${port}`,
    adminHeaders: { cookie: cookieFor(adminId) },
    driverHeaders: { cookie: cookieFor(driverId) },
  };
}

test("serves health and lists contract-valid sectors", async (context) => {
  const { server, baseUrl, driverHeaders } = await startApp(
    createFakeRepository(),
  );
  context.after(() => server.close());

  const healthResponse = await fetch(`${baseUrl}/health`);
  assert.deepEqual(await healthResponse.json(), { status: "ok" });

  const sectorsResponse = await fetch(`${baseUrl}/v1/sectors`, {
    headers: driverHeaders,
  });
  assert.equal(sectorsResponse.status, 200);
  sectorListResponseSchema.parse(await sectorsResponse.json());

  const detailResponse = await fetch(
    `${baseUrl}/v1/sectors/${initialSector.id}`,
    { headers: driverHeaders },
  );
  assert.equal(detailResponse.status, 200);
  sectorResponseSchema.parse(await detailResponse.json());
});

test("creates, reads, updates and deletes a sector", async (context) => {
  const { server, baseUrl, adminHeaders } = await startApp(
    createFakeRepository(),
  );
  context.after(() => server.close());

  const createResponse = await fetch(`${baseUrl}/v1/sectors`, {
    method: "POST",
    headers: { ...adminHeaders, "content-type": "application/json" },
    body: JSON.stringify({
      name: "  Setor Sul  ",
      location: "Portao B",
      capacity: 20,
      hourlyRate: 7.5,
    }),
  });
  assert.equal(createResponse.status, 201);
  const created = sectorResponseSchema.parse(await createResponse.json()).data;
  assert.equal(created.name, "Setor Sul");
  assert.equal(created.availableSpots, 20);

  const detailResponse = await fetch(`${baseUrl}/v1/sectors/${created.id}`, {
    headers: adminHeaders,
  });
  assert.equal(detailResponse.status, 200);

  const updateResponse = await fetch(`${baseUrl}/v1/sectors/${created.id}`, {
    method: "PATCH",
    headers: { ...adminHeaders, "content-type": "application/json" },
    body: JSON.stringify({ capacity: 24, hourlyRate: 9 }),
  });
  assert.equal(updateResponse.status, 200);
  const updated = sectorResponseSchema.parse(await updateResponse.json()).data;
  assert.equal(updated.availableSpots, 24);
  assert.equal(updated.hourlyRate, 9);

  const deleteResponse = await fetch(`${baseUrl}/v1/sectors/${created.id}`, {
    method: "DELETE",
    headers: adminHeaders,
  });
  assert.equal(deleteResponse.status, 204);

  const missingResponse = await fetch(`${baseUrl}/v1/sectors/${created.id}`, {
    headers: adminHeaders,
  });
  assert.equal(missingResponse.status, 404);
});

test("rejects invalid input and capacity below occupied spots", async (context) => {
  const { server, baseUrl, adminHeaders } = await startApp(
    createFakeRepository(),
  );
  context.after(() => server.close());

  const invalidResponse = await fetch(`${baseUrl}/v1/sectors`, {
    method: "POST",
    headers: { ...adminHeaders, "content-type": "application/json" },
    body: JSON.stringify({
      name: "",
      location: "Centro",
      capacity: 0,
      hourlyRate: -1,
    }),
  });
  assert.equal(invalidResponse.status, 400);
  apiErrorSchema.parse(await invalidResponse.json());

  const conflictResponse = await fetch(
    `${baseUrl}/v1/sectors/${initialSector.id}`,
    {
      method: "PATCH",
      headers: { ...adminHeaders, "content-type": "application/json" },
      body: JSON.stringify({ capacity: 7 }),
    },
  );
  assert.equal(conflictResponse.status, 409);
  const conflict = apiErrorSchema.parse(await conflictResponse.json());
  assert.equal(conflict.error.code, "SECTOR_CAPACITY_CONFLICT");
});

test("returns conflict when deleting a sector in use", async (context) => {
  const repository = createFakeRepository();
  repository.delete = async () => "in_use";
  const { server, baseUrl, adminHeaders } = await startApp(repository);
  context.after(() => server.close());

  const response = await fetch(`${baseUrl}/v1/sectors/${initialSector.id}`, {
    method: "DELETE",
    headers: adminHeaders,
  });

  assert.equal(response.status, 409);
  const error = apiErrorSchema.parse(await response.json());
  assert.equal(error.error.code, "SECTOR_IN_USE");
});

test("requires authentication for every protected route", async (context) => {
  const { server, baseUrl } = await startApp(createFakeRepository());
  context.after(() => server.close());

  const protectedRoutes = [
    { method: "GET", path: "/v1/auth/me" },
    { method: "GET", path: "/v1/users" },
    { method: "GET", path: "/v1/admin/session" },
    { method: "GET", path: "/v1/sectors" },
    { method: "GET", path: `/v1/sectors/${initialSector.id}` },
    { method: "POST", path: "/v1/sectors" },
    { method: "PATCH", path: `/v1/sectors/${initialSector.id}` },
    { method: "DELETE", path: `/v1/sectors/${initialSector.id}` },
    { method: "GET", path: "/v1/reservations" },
    { method: "POST", path: "/v1/reservations" },
  ] as const;

  for (const route of protectedRoutes) {
    const response = await fetch(`${baseUrl}${route.path}`, {
      method: route.method,
    });

    assert.equal(
      response.status,
      401,
      `${route.method} ${route.path} must reject anonymous access`,
    );
    const error = apiErrorSchema.parse(await response.json());
    assert.equal(error.error.code, "UNAUTHENTICATED");
  }
});

test("blocks a USER from every admin route", async (context) => {
  const { server, baseUrl, driverHeaders } = await startApp(
    createFakeRepository(),
  );
  context.after(() => server.close());

  const adminRoutes = [
    { method: "GET", path: "/v1/users" },
    { method: "GET", path: "/v1/admin/session" },
    { method: "POST", path: "/v1/sectors" },
    { method: "PATCH", path: `/v1/sectors/${initialSector.id}` },
    { method: "DELETE", path: `/v1/sectors/${initialSector.id}` },
  ] as const;

  for (const route of adminRoutes) {
    const response = await fetch(`${baseUrl}${route.path}`, {
      method: route.method,
      headers: driverHeaders,
    });

    assert.equal(
      response.status,
      403,
      `${route.method} ${route.path} must reject USER access`,
    );
    const error = apiErrorSchema.parse(await response.json());
    assert.equal(error.error.code, "FORBIDDEN");
  }
});
