import assert from "node:assert/strict";
import test from "node:test";

import {
  createSectorSchema,
  sectorListResponseSchema,
  updateSectorSchema,
} from "./sectors.js";

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

test("normalizes a valid sector creation input", () => {
  const result = createSectorSchema.parse({
    name: "  Setor Sul  ",
    location: "  Portao B  ",
    capacity: 20,
    hourlyRate: 7.5,
  });

  assert.deepEqual(result, {
    name: "Setor Sul",
    location: "Portao B",
    capacity: 20,
    hourlyRate: 7.5,
  });
});

test("rejects invalid sector creation values", () => {
  const result = createSectorSchema.safeParse({
    name: " ",
    location: "Centro",
    capacity: 0,
    hourlyRate: -1,
  });

  assert.equal(result.success, false);
});

test("requires at least one field in a sector update", () => {
  assert.equal(updateSectorSchema.safeParse({}).success, false);
  assert.equal(
    updateSectorSchema.safeParse({ name: "Setor Norte" }).success,
    true,
  );
});
