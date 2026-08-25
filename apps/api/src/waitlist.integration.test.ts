import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";

import { eq } from "drizzle-orm";

import { createDatabaseClient } from "./db/client.js";
import {
  reservationEvents,
  reservations,
  sectors,
  users,
  waitlistEntries,
} from "./db/schema.js";
import { createWaitlistRepository } from "./repositories/waitlist.js";
import { createReservationRepository } from "./repositories/reservations.js";

test("persists join and leave transitions atomically", async () => {
  const { db, pool } = createDatabaseClient();
  const userId = randomUUID();
  const sectorId = randomUUID();
  const now = new Date("2030-01-01T10:00:00.000Z");
  const repository = createWaitlistRepository(db, () => now);
  const plate = randomUUID().replaceAll("-", "").slice(0, 7).toUpperCase();

  try {
    await db.insert(users).values({
      id: userId,
      name: "Waitlist Integration Test",
      email: `${userId}@example.com`,
      passwordHash: "unused",
      role: "USER",
    });
    await db.insert(sectors).values({
      id: sectorId,
      name: "Full test sector",
      location: "Integration test",
      capacity: 1,
      availableSpots: 0,
      hourlyRate: 1,
    });

    const joined = await repository.join({
      userId,
      sectorId,
      plate,
      expectedArrivalAt: "2030-01-01T12:00:00.000Z",
    });
    assert.equal(joined.kind, "joined");

    if (joined.kind !== "joined") {
      return;
    }

    assert.equal(joined.entry.position, 1);
    assert.equal(joined.entry.isMine, true);
    assert.equal(joined.entry.maskedPlate.endsWith(plate.slice(-2)), true);

    const listedForOwner = await repository.list(sectorId, userId);
    assert.equal(listedForOwner.kind, "found");
    if (listedForOwner.kind === "found") {
      assert.equal(listedForOwner.response.data[0]?.isMine, true);
    }

    const listedForAnotherUser = await repository.list(sectorId, randomUUID());
    assert.equal(listedForAnotherUser.kind, "found");
    if (listedForAnotherUser.kind === "found") {
      assert.equal(listedForAnotherUser.response.data[0]?.isMine, false);
    }

    assert.equal(await repository.leave(joined.entry.id, userId), "left");

    const [reservation] = await db
      .select({ id: reservations.id, status: reservations.status })
      .from(reservations)
      .where(eq(reservations.userId, userId));
    assert.equal(reservation?.status, "LEFT_WAITLIST");

    const [entry] = await db
      .select({ status: waitlistEntries.status })
      .from(waitlistEntries)
      .where(eq(waitlistEntries.id, joined.entry.id));
    assert.equal(entry?.status, "LEFT");

    if (!reservation) {
      assert.fail("Expected a reservation created by the waitlist flow");
    }

    const events = await db
      .select({ type: reservationEvents.type })
      .from(reservationEvents)
      .where(eq(reservationEvents.reservationId, reservation.id));
    assert.deepEqual(
      events.map((event) => event.type).sort(),
      ["RESERVATION_CREATED", "WAITLIST_JOINED", "WAITLIST_LEFT"].sort(),
    );
  } finally {
    await db.delete(reservations).where(eq(reservations.userId, userId));
    await db.delete(sectors).where(eq(sectors.id, sectorId));
    await db.delete(users).where(eq(users.id, userId));
    await pool.end();
  }
});

test("promotes the first real waitlist entry when a reservation is cancelled", async () => {
  const { db, pool } = createDatabaseClient();
  const activeUserId = randomUUID();
  const waitingUserId = randomUUID();
  const sectorId = randomUUID();
  const activePlate = randomUUID().replaceAll("-", "").slice(0, 7).toUpperCase();
  const waitingPlate = randomUUID().replaceAll("-", "").slice(0, 7).toUpperCase();
  const expectedArrivalAt = new Date(Date.now() + 3_600_000).toISOString();
  const reservationRepository = createReservationRepository(db);
  const waitlistRepository = createWaitlistRepository(db);
  const activeActor = { id: activeUserId, role: "USER" as const };
  const waitingActor = { id: waitingUserId, role: "USER" as const };

  try {
    await db.insert(users).values([
      {
        id: activeUserId,
        name: "Active reservation test user",
        email: `${activeUserId}@example.com`,
        passwordHash: "unused",
        role: "USER",
      },
      {
        id: waitingUserId,
        name: "Waiting test user",
        email: `${waitingUserId}@example.com`,
        passwordHash: "unused",
        role: "USER",
      },
    ]);
    await db.insert(sectors).values({
      id: sectorId,
      name: "Promotion test sector",
      location: "Integration test",
      capacity: 1,
      availableSpots: 1,
      hourlyRate: 1,
    });

    const active = await reservationRepository.create(
      { sectorId, plate: activePlate, expectedArrivalAt },
      activeActor,
    );
    assert.equal(active.kind, "created");
    if (active.kind !== "created") {
      return;
    }

    const waiting = await waitlistRepository.join({
      userId: waitingUserId,
      sectorId,
      plate: waitingPlate,
      expectedArrivalAt,
    });
    assert.equal(waiting.kind, "joined");
    if (waiting.kind !== "joined") {
      return;
    }

    const cancelled = await reservationRepository.cancel(
      active.reservation.id,
      activeActor,
    );
    assert.equal(cancelled.kind, "cancelled");
    if (cancelled.kind !== "cancelled") {
      return;
    }

    assert.equal(cancelled.promoted?.userId, waitingUserId);
    assert.equal(cancelled.promoted?.plate, waitingPlate);
    assert.equal(cancelled.promoted?.status, "ACTIVE");

    const [sector] = await db
      .select({ availableSpots: sectors.availableSpots })
      .from(sectors)
      .where(eq(sectors.id, sectorId));
    assert.equal(sector?.availableSpots, 0);

    const [entry] = await db
      .select({ status: waitlistEntries.status })
      .from(waitlistEntries)
      .where(eq(waitlistEntries.id, waiting.entry.id));
    assert.equal(entry?.status, "PROMOTED");

    if (!cancelled.promoted) {
      assert.fail("Expected the first waitlist reservation to be promoted");
    }

    const history = await reservationRepository.listEvents(
      cancelled.promoted.id,
      waitingActor,
    );
    assert.equal(history.kind, "found");
    if (history.kind === "found") {
      assert.deepEqual(
        history.events.map((event) => event.type),
        ["RESERVATION_CREATED", "WAITLIST_JOINED", "WAITLIST_PROMOTED"],
      );
      assert.equal(
        history.events.every((event) => event.description.includes(waitingPlate)),
        true,
      );
      assert.equal(
        history.events[2]?.triggeredByReservationId,
        active.reservation.id,
      );
    }
  } finally {
    await db
      .delete(reservations)
      .where(eq(reservations.userId, activeUserId));
    await db
      .delete(reservations)
      .where(eq(reservations.userId, waitingUserId));
    await db.delete(sectors).where(eq(sectors.id, sectorId));
    await db.delete(users).where(eq(users.id, activeUserId));
    await db.delete(users).where(eq(users.id, waitingUserId));
    await pool.end();
  }
});
