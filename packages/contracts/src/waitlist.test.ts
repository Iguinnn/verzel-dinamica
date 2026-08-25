import assert from "node:assert/strict";
import test from "node:test";

import {
  joinWaitlistSchema,
  waitlistEntrySchema,
  waitlistListResponseSchema,
} from "./waitlist.js";

test("normalizes a plate when joining a waitlist", () => {
  const input = joinWaitlistSchema.parse({
    plate: "abc-1d23",
    expectedArrivalAt: "2099-01-01T12:00:00.000Z",
  });

  assert.equal(input.plate, "ABC1D23");
});

test("rejects empty plates and invalid arrival dates", () => {
  assert.equal(
    joinWaitlistSchema.safeParse({ plate: "---", expectedArrivalAt: "today" })
      .success,
    false,
  );
});

test("accepts an ordered waitlist response with masked plates", () => {
  const entry = {
    id: "11111111-1111-4111-8111-111111111111",
    sectorId: "33333333-3333-4333-8333-333333333333",
    position: 1,
    maskedPlate: "*****23",
    isMine: true,
    expectedArrivalAt: "2099-01-01T12:00:00.000Z",
    joinedAt: "2099-01-01T10:00:00.000Z",
  };

  waitlistEntrySchema.parse(entry);
  waitlistListResponseSchema.parse({ data: [entry] });
});
