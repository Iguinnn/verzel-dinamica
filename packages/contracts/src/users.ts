import { z } from "zod";

export const userRoleSchema = z.enum(["USER", "ADMIN"]);

const normalizedEmailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email());

export const userSchema = z.object({
  id: z.uuid(),
  name: z.string().trim().min(1).max(120),
  email: normalizedEmailSchema,
  role: userRoleSchema,
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export const registerUserRequestSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: normalizedEmailSchema,
  password: z.string().min(8).max(128),
});

export const loginRequestSchema = z.object({
  email: normalizedEmailSchema,
  password: z.string().min(1).max(128),
});

export const userResponseSchema = z.object({
  data: userSchema,
});

export const userListResponseSchema = z.object({
  data: z.array(userSchema),
});

export const sessionResponseSchema = z.object({
  data: z.object({
    user: userSchema,
  }),
});

export type UserRole = z.infer<typeof userRoleSchema>;
export type User = z.infer<typeof userSchema>;
export type RegisterUserRequest = z.infer<typeof registerUserRequestSchema>;
export type LoginRequest = z.infer<typeof loginRequestSchema>;
export type UserResponse = z.infer<typeof userResponseSchema>;
export type UserListResponse = z.infer<typeof userListResponseSchema>;
export type SessionResponse = z.infer<typeof sessionResponseSchema>;
