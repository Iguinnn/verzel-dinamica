import assert from "node:assert/strict";
import test from "node:test";

import { sectorListResponseSchema } from "./sectors.js";

test("accepts a valid sector list response", () => {
  const result = sectorListResponseSchema.safeParse({
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
  });

  assert.equal(result.success, true);
});

test("rejects availability above capacity", () => {
  const result = sectorListResponseSchema.safeParse({
    data: [
      {
        id: "ed31bd55-cfb5-488e-bf63-14687db7390b",
        name: "Setor Central",
        location: "Entrada principal",
        capacity: 1,
        availableSpots: 2,
        hourlyRate: 8,
      },
    ],
  });

  assert.equal(result.success, false);
});
