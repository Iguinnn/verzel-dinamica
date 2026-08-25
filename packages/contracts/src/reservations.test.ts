import assert from "node:assert/strict";
import test from "node:test";

import {
  createReservationSchema,
  normalizePlate,
  reservationEventListResponseSchema,
  reservationSchema,
} from "./reservations.js";

const sampleReservation = {
  id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  userId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  sectorId: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
  plate: "ABC1D23",
  expectedArrivalAt: "2026-08-26T15:00:00.000Z",
  status: "ACTIVE" as const,
  activatedAt: "2026-08-25T12:00:00.000Z",
  cancelledAt: null,
  createdAt: "2026-08-25T12:00:00.000Z",
  updatedAt: "2026-08-25T12:00:00.000Z",
};

test("normalizes plates to uppercase without punctuation", () => {
  assert.equal(normalizePlate(" abc-1d23 "), "ABC1D23");
});

test("accepts a valid public reservation", () => {
  assert.equal(reservationSchema.safeParse(sampleReservation).success, true);
});

test("rejects an empty plate", () => {
  const result = createReservationSchema.safeParse({
    sectorId: sampleReservation.sectorId,
    plate: "   ---  ",
    expectedArrivalAt: "2099-01-01T12:00:00.000Z",
  });
  assert.equal(result.success, false);
});

test("rejects an arrival in the past", () => {
  const result = createReservationSchema.safeParse({
    sectorId: sampleReservation.sectorId,
    plate: "ABC1D23",
    expectedArrivalAt: "2020-01-01T12:00:00.000Z",
  });
  assert.equal(result.success, false);
});

test("accepts a chronological event list", () => {
  const result = reservationEventListResponseSchema.safeParse({
    data: [
      {
        id: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
        reservationId: sampleReservation.id,
        actorUserId: sampleReservation.userId,
        type: "RESERVATION_CREATED",
        occurredAt: "2026-08-25T12:00:00.000Z",
        triggeredByReservationId: null,
        details: { plate: "ABC1D23" },
        description: "Reserva criada para a placa ABC1D23.",
      },
    ],
  });
  assert.equal(result.success, true);
});
