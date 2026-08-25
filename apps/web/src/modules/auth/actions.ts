"use server";

import { redirect } from "next/navigation";

import { routes } from "@/config/site";

/**
 * TODO(backend): clear the session cookie before redirecting.
 *
 * Kept as a Server Action so the sign-out control stays a plain `<form>`
 * submit. Adding the real teardown here requires no change to `UserMenu`.
 */
export async function signOutAction(): Promise<void> {
  redirect(routes.login);
}

/**
 * TODO(backend): validate the credentials and create the session.
 *
 * The login form posts here. Returning early keeps the scaffolded screen
 * navigable while authentication is being built.
 */
export async function signInAction(): Promise<void> {
  redirect(routes.dashboard);
}
