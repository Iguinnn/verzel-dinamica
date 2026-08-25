import assert from "node:assert/strict";
import test from "node:test";

import {
  loginRequestSchema,
  registerUserRequestSchema,
  sessionResponseSchema,
  userSchema,
} from "./users.js";

const sampleUser = {
  id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  name: "Rayane Souza",
  email: "rayane@example.com",
  role: "USER" as const,
  createdAt: "2026-08-25T12:00:00.000Z",
  updatedAt: "2026-08-25T12:00:00.000Z",
};

test("accepts a valid public user", () => {
  const result = userSchema.safeParse(sampleUser);
  assert.equal(result.success, true);
});

test("normalizes email to lowercase on login", () => {
  const result = loginRequestSchema.safeParse({
    email: "  Admin@Example.COM ",
    password: "secreta123",
  });

  assert.equal(result.success, true);
  if (result.success) {
    assert.equal(result.data.email, "admin@example.com");
  }
});

test("rejects short password on register", () => {
  const result = registerUserRequestSchema.safeParse({
    name: "Motorista",
    email: "motorista@example.com",
    password: "123",
  });

  assert.equal(result.success, false);
});

test("accepts a valid session response", () => {
  const result = sessionResponseSchema.safeParse({
    data: { user: sampleUser },
  });

  assert.equal(result.success, true);
});

test("rejects user payload that leaks password_hash", () => {
  const result = userSchema.safeParse({
    ...sampleUser,
    passwordHash: "should-not-be-here",
  });

  assert.equal(result.success, true);
  if (result.success) {
    assert.equal("passwordHash" in result.data, false);
  }
});
