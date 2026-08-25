"use server";

import { redirect } from "next/navigation";

import {
  loginRequestSchema,
  registerUserRequestSchema,
} from "@parking/contracts";

import { routes } from "@/config/site";
import {
  AuthApiError,
  clearSessionToken,
  login,
  persistSessionToken,
  registerUser,
} from "@/lib/server/auth";

export async function signOutAction(): Promise<void> {
  await clearSessionToken();
  redirect(routes.login);
}

export async function signInAction(formData: FormData): Promise<void> {
  const parsed = loginRequestSchema.safeParse({
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  });

  if (!parsed.success) {
    redirect(`${routes.login}?error=invalid`);
  }

  try {
    const { token } = await login(parsed.data);
    await persistSessionToken(token);
  } catch {
    redirect(`${routes.login}?error=invalid`);
  }

  redirect(routes.dashboard);
}

export async function signUpAction(formData: FormData): Promise<void> {
  const parsed = registerUserRequestSchema.safeParse({
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  });

  if (!parsed.success) {
    redirect(`${routes.signup}?error=invalid`);
  }

  try {
    const { token } = await registerUser(parsed.data);
    await persistSessionToken(token);
  } catch (error) {
    if (error instanceof AuthApiError && error.code === "EMAIL_ALREADY_EXISTS") {
      redirect(`${routes.signup}?error=exists`);
    }

    redirect(`${routes.signup}?error=failed`);
  }

  redirect(routes.dashboard);
}
