import assert from "node:assert/strict";
import test from "node:test";

import {
  reservationEventSchema,
  reservationHistorySchema,
} from "./history.js";

const reservationId = "0f2f2d4c-9d1f-4a5a-8f2e-1c0b3a4d5e6f";
const sectorId = "1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d";

function event(overrides: Record<string, unknown> = {}) {
  return {
    id: "2b3c4d5e-6f7a-4b8c-9d0e-1f2a3b4c5d6e",
    reservationId,
    type: "RESERVATION_CREATED",
    occurredAt: "2026-08-20T12:00:00.000Z",
    actor: null,
    triggeredByReservation: null,
    details: null,
    ...overrides,
  };
}

const reservation = {
  id: reservationId,
  plate: "ABC1D23",
  sectorId,
  sectorName: "Setor A - VIP",
  status: "ACTIVE",
  expectedArrivalAt: "2026-08-26T13:00:00.000Z",
  createdAt: "2026-08-20T12:00:00.000Z",
};

test("accepts a history holding only the creation event", () => {
  const result = reservationHistorySchema.safeParse({
    reservation,
    events: [event()],
  });

  assert.equal(result.success, true);
});

test("rejects a history without events", () => {
  const result = reservationHistorySchema.safeParse({
    reservation,
    events: [],
  });

  assert.equal(result.success, false);
});

test("rejects an unknown event type", () => {
  const result = reservationEventSchema.safeParse(
    event({ type: "RESERVATION_ARCHIVED" }),
  );

  assert.equal(result.success, false);
});

test("rejects a promotion without the cancellation that originated it", () => {
  const result = reservationEventSchema.safeParse(
    event({ type: "WAITLIST_PROMOTED" }),
  );

  assert.equal(result.success, false);
  assert.deepEqual(result.error?.issues[0]?.path, ["triggeredByReservation"]);
});

test("accepts a promotion pointing at the cancelled reservation", () => {
  const result = reservationEventSchema.safeParse(
    event({
      type: "WAITLIST_PROMOTED",
      triggeredByReservation: {
        id: "3c4d5e6f-7a8b-4c9d-8e1f-2a3b4c5d6e7f",
        plate: "DEF2G45",
      },
    }),
  );

  assert.equal(result.success, true);
});

test("rejects an event timestamp that is not an ISO instant", () => {
  const result = reservationEventSchema.safeParse(
    event({ occurredAt: "20/08/2026 12:00" }),
  );

  assert.equal(result.success, false);
});

test("keeps the human actor when the event has one", () => {
  const result = reservationEventSchema.safeParse(
    event({
      type: "RESERVATION_CANCELLED",
      actor: {
        id: "4d5e6f7a-8b9c-4d0e-9f1a-2b3c4d5e6f7a",
        name: "Ana Souza",
      },
    }),
  );

  assert.equal(result.success, true);
  assert.equal(result.data?.actor?.name, "Ana Souza");
});
