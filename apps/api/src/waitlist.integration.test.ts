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
