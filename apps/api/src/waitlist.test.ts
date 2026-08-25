import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import test from "node:test";

import {
  apiErrorSchema,
  waitlistEntryResponseSchema,
  waitlistListResponseSchema,
  type WaitlistEntry,
} from "@parking/contracts";

import { sessionCookie, signSession } from "./auth/session.js";
import { createApp } from "./app.js";
import { createMemoryReservationRepository } from "./repositories/reservations.js";
import type { SectorRepository } from "./repositories/sectors.js";
import { createMemoryUserRepository } from "./repositories/users.js";
import type {
  JoinWaitlistResult,
  LeaveWaitlistResult,
  ListWaitlistResult,
  WaitlistRepository,
} from "./repositories/waitlist.js";

const sessionSecret = "test-session-secret";
const driverId = "11111111-1111-4111-8111-111111111111";
const sectorId = "22222222-2222-4222-8222-222222222222";
const entryId = "33333333-3333-4333-8333-333333333333";

const waitlistEntry: WaitlistEntry = {
  id: entryId,
  sectorId,
  position: 1,
  maskedPlate: "*****23",
  isMine: true,
  expectedArrivalAt: "2099-01-01T12:00:00.000Z",
  joinedAt: "2099-01-01T10:00:00.000Z",
};

function createSectorRepository(): SectorRepository {
  return {
    async list() {
      return { data: [] };
    },
    async findById() {
      return null;
    },
    async create(input) {
      return {
        id: sectorId,
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

function createWaitlistRepository(
  overrides: Partial<WaitlistRepository> = {},
): WaitlistRepository {
  return {
    async join() {
      return { kind: "joined", entry: waitlistEntry };
    },
    async list() {
      return { kind: "found", response: { data: [waitlistEntry] } };
    },
    async leave() {
      return "left";
    },
    ...overrides,
  };
}

function cookieFor(userId: string): string {
  return sessionCookie(signSession(userId, sessionSecret)).split(";", 1)[0] ?? "";
}

async function startApp(waitlist: WaitlistRepository) {
  const now = new Date();
  const server = createApp({
    sectors: createSectorRepository(),
    users: createMemoryUserRepository([
      {
        id: driverId,
        name: "Motorista",
        email: "driver@example.com",
        passwordHash: "unused",
        role: "USER",
        createdAt: now,
        updatedAt: now,
      },
    ]),
    reservations: createMemoryReservationRepository(),
    waitlist,
    sessionSecret,
  }).listen(0);
  await new Promise<void>((resolve) => server.once("listening", resolve));
  const { port } = server.address() as AddressInfo;
  return {
    server,
    baseUrl: `http://127.0.0.1:${port}`,
    headers: { cookie: cookieFor(driverId) },
  };
}

test("joins, lists and leaves a waitlist as the authenticated user", async (context) => {
  let joinedPlate: string | undefined;
  let leavingUserId: string | undefined;
  const waitlist = createWaitlistRepository({
    async join(input) {
      joinedPlate = input.plate;
      assert.equal(input.userId, driverId);
      assert.equal(input.sectorId, sectorId);
      return { kind: "joined", entry: waitlistEntry };
    },
    async leave(receivedEntryId, userId) {
      assert.equal(receivedEntryId, entryId);
      leavingUserId = userId;
      return "left";
    },
  });
  const { server, baseUrl, headers } = await startApp(waitlist);
  context.after(() => server.close());

  const joinResponse = await fetch(`${baseUrl}/v1/sectors/${sectorId}/waitlist`, {
    method: "POST",
    headers: { ...headers, "content-type": "application/json" },
    body: JSON.stringify({
      plate: "abc-1d23",
      expectedArrivalAt: waitlistEntry.expectedArrivalAt,
    }),
  });
  assert.equal(joinResponse.status, 201);
  waitlistEntryResponseSchema.parse(await joinResponse.json());
  assert.equal(joinedPlate, "ABC1D23");

  const listResponse = await fetch(
    `${baseUrl}/v1/sectors/${sectorId}/waitlist`,
    { headers },
  );
  assert.equal(listResponse.status, 200);
  const listed = waitlistListResponseSchema.parse(await listResponse.json());
  assert.deepEqual(listed.data, [waitlistEntry]);

  const leaveResponse = await fetch(`${baseUrl}/v1/waitlist/${entryId}`, {
    method: "DELETE",
    headers,
  });
  assert.equal(leaveResponse.status, 204);
  assert.equal(leavingUserId, driverId);
});

test("requires authentication on every waitlist route", async (context) => {
  const { server, baseUrl } = await startApp(createWaitlistRepository());
  context.after(() => server.close());

  const routes = [
    { method: "POST", path: `/v1/sectors/${sectorId}/waitlist` },
    { method: "GET", path: `/v1/sectors/${sectorId}/waitlist` },
    { method: "DELETE", path: `/v1/waitlist/${entryId}` },
  ] as const;

  for (const route of routes) {
    const response = await fetch(`${baseUrl}${route.path}`, {
      method: route.method,
    });
    assert.equal(response.status, 401);
    const error = apiErrorSchema.parse(await response.json());
    assert.equal(error.error.code, "UNAUTHENTICATED");
  }
});

test("maps waitlist business conflicts to API errors", async (context) => {
  let joinResult: JoinWaitlistResult = { kind: "sector_has_availability" };
  let listResult: ListWaitlistResult = { kind: "sector_not_found" };
  let leaveResult: LeaveWaitlistResult = "not_found";
  const waitlist = createWaitlistRepository({
    async join() {
      return joinResult;
    },
    async list() {
      return listResult;
    },
    async leave() {
      return leaveResult;
    },
  });
  const { server, baseUrl, headers } = await startApp(waitlist);
  context.after(() => server.close());
  const joinRequest = () =>
    fetch(`${baseUrl}/v1/sectors/${sectorId}/waitlist`, {
      method: "POST",
      headers: { ...headers, "content-type": "application/json" },
      body: JSON.stringify({
        plate: "ABC1D23",
        expectedArrivalAt: waitlistEntry.expectedArrivalAt,
      }),
    });

  const availabilityResponse = await joinRequest();
  assert.equal(availabilityResponse.status, 409);
  assert.equal(
    apiErrorSchema.parse(await availabilityResponse.json()).error.code,
    "SECTOR_HAS_AVAILABILITY",
  );

  joinResult = { kind: "active_plate" };
  const activeResponse = await joinRequest();
  assert.equal(activeResponse.status, 409);
  assert.equal(
    apiErrorSchema.parse(await activeResponse.json()).error.code,
    "PLATE_HAS_ACTIVE_RESERVATION",
  );

  joinResult = { kind: "duplicate_entry" };
  const duplicateResponse = await joinRequest();
  assert.equal(duplicateResponse.status, 409);
  assert.equal(
    apiErrorSchema.parse(await duplicateResponse.json()).error.code,
    "WAITLIST_ENTRY_EXISTS",
  );

  const missingSectorResponse = await fetch(
    `${baseUrl}/v1/sectors/${sectorId}/waitlist`,
    { headers },
  );
  assert.equal(missingSectorResponse.status, 404);

  const missingEntryResponse = await fetch(`${baseUrl}/v1/waitlist/${entryId}`, {
    method: "DELETE",
    headers,
  });
  assert.equal(missingEntryResponse.status, 404);

  listResult = { kind: "found", response: { data: [] } };
  leaveResult = "not_waiting";
  const staleEntryResponse = await fetch(`${baseUrl}/v1/waitlist/${entryId}`, {
    method: "DELETE",
    headers,
  });
  assert.equal(staleEntryResponse.status, 409);
  assert.equal(
    apiErrorSchema.parse(await staleEntryResponse.json()).error.code,
    "WAITLIST_ENTRY_NOT_WAITING",
  );
});
