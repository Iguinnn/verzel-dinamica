import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import test from "node:test";

import {
  apiErrorSchema,
  cancelReservationResponseSchema,
  reservationEventListResponseSchema,
  reservationResponseSchema,
} from "@parking/contracts";

import { sessionCookie, signSession } from "./auth/session.js";
import { createApp } from "./app.js";
import { createMemoryReservationRepository } from "./repositories/reservations.js";
import type { SectorRepository } from "./repositories/sectors.js";
import { createMemoryUserRepository } from "./repositories/users.js";
import type { WaitlistRepository } from "./repositories/waitlist.js";

const sessionSecret = "test-session-secret";
const adminId = "11111111-1111-4111-8111-111111111111";
const driverId = "22222222-2222-4222-8222-222222222222";
const otherDriverId = "33333333-3333-4333-8333-333333333333";
const sectorId = "ed31bd55-cfb5-488e-bf63-14687db7390b";

function emptySectors(): SectorRepository {
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

function emptyWaitlist(): WaitlistRepository {
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

function futureArrival() {
  return new Date(Date.now() + 60 * 60 * 1000).toISOString();
}

async function startApp(
  reservations = createMemoryReservationRepository([
    { id: sectorId, availableSpots: 1 },
  ]),
) {
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
    {
      id: otherDriverId,
      name: "Outro",
      email: "other@example.com",
      passwordHash: "unused",
      role: "USER",
      createdAt: now,
      updatedAt: now,
    },
  ]);
  const server = createApp({
    sectors: emptySectors(),
    users,
    reservations,
    waitlist: emptyWaitlist(),
    sessionSecret,
  }).listen(0);
  await new Promise<void>((resolve) => server.once("listening", resolve));
  const { port } = server.address() as AddressInfo;
  return {
    server,
    baseUrl: `http://127.0.0.1:${port}`,
    driverHeaders: {
      cookie: cookieFor(driverId),
      "content-type": "application/json",
    },
    otherHeaders: {
      cookie: cookieFor(otherDriverId),
      "content-type": "application/json",
    },
    adminHeaders: {
      cookie: cookieFor(adminId),
      "content-type": "application/json",
    },
  };
}

test("creates an active reservation, records history and consumes a spot", async (context) => {
  const { server, baseUrl, driverHeaders } = await startApp();
  context.after(() => server.close());

  const createResponse = await fetch(`${baseUrl}/v1/reservations`, {
    method: "POST",
    headers: driverHeaders,
    body: JSON.stringify({
      sectorId,
      plate: " abc-1d23 ",
      expectedArrivalAt: futureArrival(),
    }),
  });
  assert.equal(createResponse.status, 201);
  const created = reservationResponseSchema.parse(await createResponse.json());
  assert.equal(created.data.plate, "ABC1D23");
  assert.equal(created.data.status, "ACTIVE");
  assert.equal(created.data.userId, driverId);

  const history = await fetch(
    `${baseUrl}/v1/reservations/${created.data.id}/events`,
    { headers: driverHeaders },
  );
  assert.equal(history.status, 200);
  const events = reservationEventListResponseSchema.parse(await history.json());
  assert.equal(events.data.length, 1);
  assert.equal(events.data[0]?.type, "RESERVATION_CREATED");

  const full = await fetch(`${baseUrl}/v1/reservations`, {
    method: "POST",
    headers: driverHeaders,
    body: JSON.stringify({
      sectorId,
      plate: "XYZ1A23",
      expectedArrivalAt: futureArrival(),
    }),
  });
  assert.equal(full.status, 409);
  assert.equal(
    apiErrorSchema.parse(await full.json()).error.code,
    "SECTOR_FULL",
  );
});

test("rejects empty plate, past arrival and a second active plate", async (context) => {
  const reservations = createMemoryReservationRepository([
    { id: sectorId, availableSpots: 2 },
  ]);
  const { server, baseUrl, driverHeaders } = await startApp(reservations);
  context.after(() => server.close());

  const emptyPlate = await fetch(`${baseUrl}/v1/reservations`, {
    method: "POST",
    headers: driverHeaders,
    body: JSON.stringify({
      sectorId,
      plate: " --- ",
      expectedArrivalAt: futureArrival(),
    }),
  });
  assert.equal(emptyPlate.status, 400);

  const past = await fetch(`${baseUrl}/v1/reservations`, {
    method: "POST",
    headers: driverHeaders,
    body: JSON.stringify({
      sectorId,
      plate: "ABC1D23",
      expectedArrivalAt: "2020-01-01T12:00:00.000Z",
    }),
  });
  assert.equal(past.status, 400);

  const first = await fetch(`${baseUrl}/v1/reservations`, {
    method: "POST",
    headers: driverHeaders,
    body: JSON.stringify({
      sectorId,
      plate: "ABC1D23",
      expectedArrivalAt: futureArrival(),
    }),
  });
  assert.equal(first.status, 201);

  const duplicate = await fetch(`${baseUrl}/v1/reservations`, {
    method: "POST",
    headers: driverHeaders,
    body: JSON.stringify({
      sectorId,
      plate: "abc1d23",
      expectedArrivalAt: futureArrival(),
    }),
  });
  assert.equal(duplicate.status, 409);
  assert.equal(
    apiErrorSchema.parse(await duplicate.json()).error.code,
    "PLATE_ALREADY_ACTIVE",
  );
});

test("cancels an active reservation, restores quota and records the event", async (context) => {
  const { server, baseUrl, driverHeaders } = await startApp();
  context.after(() => server.close());

  const created = reservationResponseSchema.parse(
    await (
      await fetch(`${baseUrl}/v1/reservations`, {
        method: "POST",
        headers: driverHeaders,
        body: JSON.stringify({
          sectorId,
          plate: "ABC1D23",
          expectedArrivalAt: futureArrival(),
        }),
      })
    ).json(),
  );

  const cancel = await fetch(
    `${baseUrl}/v1/reservations/${created.data.id}/cancel`,
    { method: "POST", headers: driverHeaders },
  );
  assert.equal(cancel.status, 200);
  const cancelled = cancelReservationResponseSchema.parse(await cancel.json());
  assert.equal(cancelled.data.reservation.status, "CANCELLED");
  assert.equal(cancelled.data.promoted, undefined);

  const again = await fetch(
    `${baseUrl}/v1/reservations/${created.data.id}/cancel`,
    { method: "POST", headers: driverHeaders },
  );
  assert.equal(again.status, 409);

  const afterRelease = await fetch(`${baseUrl}/v1/reservations`, {
    method: "POST",
    headers: driverHeaders,
    body: JSON.stringify({
      sectorId,
      plate: "QWE1R23",
      expectedArrivalAt: futureArrival(),
    }),
  });
  assert.equal(afterRelease.status, 201);

  const events = reservationEventListResponseSchema.parse(
    await (
      await fetch(`${baseUrl}/v1/reservations/${created.data.id}/events`, {
        headers: driverHeaders,
      })
    ).json(),
  );
  assert.deepEqual(
    events.data.map((event) => event.type),
    ["RESERVATION_CREATED", "RESERVATION_CANCELLED"],
  );
});

test("hides another driver's reservation from a USER and allows ADMIN", async (context) => {
  const { server, baseUrl, driverHeaders, otherHeaders, adminHeaders } =
    await startApp();
  context.after(() => server.close());

  const created = reservationResponseSchema.parse(
    await (
      await fetch(`${baseUrl}/v1/reservations`, {
        method: "POST",
        headers: driverHeaders,
        body: JSON.stringify({
          sectorId,
          plate: "ABC1D23",
          expectedArrivalAt: futureArrival(),
        }),
      })
    ).json(),
  );

  const hidden = await fetch(`${baseUrl}/v1/reservations/${created.data.id}`, {
    headers: otherHeaders,
  });
  assert.equal(hidden.status, 404);

  const adminView = await fetch(`${baseUrl}/v1/reservations/${created.data.id}`, {
    headers: adminHeaders,
  });
  assert.equal(adminView.status, 200);
});

test("promotes the first waitlisted plate without changing quota", async (context) => {
  const reservations = createMemoryReservationRepository([
    { id: sectorId, availableSpots: 0 },
  ]);
  const waitingId = "44444444-4444-4444-8444-444444444444";
  const now = new Date();
  reservations.seedReservation({
    id: waitingId,
    userId: otherDriverId,
    sectorId,
    plate: "WAIT123",
    expectedArrivalAt: new Date(Date.now() + 3_600_000),
    status: "WAITLISTED",
    activatedAt: null,
    cancelledAt: null,
    createdAt: now,
    updatedAt: now,
  });
  reservations.seedWaitlist({
    id: crypto.randomUUID(),
    reservationId: waitingId,
    sectorId,
    status: "WAITING",
    joinedAt: now,
  });
  reservations.seedReservation({
    id: "55555555-5555-4555-8555-555555555555",
    userId: driverId,
    sectorId,
    plate: "ACTV123",
    expectedArrivalAt: new Date(Date.now() + 3_600_000),
    status: "ACTIVE",
    activatedAt: now,
    cancelledAt: null,
    createdAt: now,
    updatedAt: now,
  });

  const { server, baseUrl, driverHeaders, adminHeaders } =
    await startApp(reservations);
  context.after(() => server.close());

  const cancel = cancelReservationResponseSchema.parse(
    await (
      await fetch(
        `${baseUrl}/v1/reservations/55555555-5555-4555-8555-555555555555/cancel`,
        { method: "POST", headers: driverHeaders },
      )
    ).json(),
  );
  assert.equal(cancel.data.promoted?.id, waitingId);
  assert.equal(cancel.data.promoted?.status, "ACTIVE");

  const stillFull = await fetch(`${baseUrl}/v1/reservations`, {
    method: "POST",
    headers: driverHeaders,
    body: JSON.stringify({
      sectorId,
      plate: "NEW1234",
      expectedArrivalAt: futureArrival(),
    }),
  });
  assert.equal(stillFull.status, 409);

  const promotedHistory = reservationEventListResponseSchema.parse(
    await (
      await fetch(`${baseUrl}/v1/reservations/${waitingId}/events`, {
        headers: adminHeaders,
      })
    ).json(),
  );
  assert.equal(promotedHistory.data[0]?.type, "WAITLIST_PROMOTED");
  assert.equal(
    promotedHistory.data[0]?.triggeredByReservationId,
    "55555555-5555-4555-8555-555555555555",
  );
});
