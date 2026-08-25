"use server";

import { redirect } from "next/navigation";

import { routes } from "@/config/site";
import { clearSessionToken, login, persistSessionToken } from "@/lib/server/auth";

export async function signOutAction(): Promise<void> {
  await clearSessionToken();
  redirect(routes.login);
}

export async function signInAction(formData: FormData): Promise<void> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  try {
    const { token } = await login({ email, password });
    await persistSessionToken(token);
  } catch {
    redirect(`${routes.login}?error=invalid`);
  }

  redirect(routes.dashboard);
}
