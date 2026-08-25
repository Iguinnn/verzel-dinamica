import type { SessionUser } from "@/modules/auth/types";

/**
 * TODO(backend): replace the placeholder below with the real session lookup.
 *
 * This is the single seam between the app shell and authentication. Everything
 * else in the UI depends only on `SessionUser`, so wiring the backend means
 * rewriting this function body and nothing else:
 *
 *   export async function getSessionUser() {
 *     const session = await readSessionCookie();
 *     return session ? toSessionUser(session) : null;
 *   }
 *
 * Returning `null` should then drive a redirect to `routes.login`.
 */
const placeholderUser: SessionUser = {
  id: "00000000-0000-0000-0000-000000000000",
  name: "Alex Moreira",
  email: "alex@parkflow.local",
  role: "ADMIN",
};

/** Returns the signed-in user, or `null` once real authentication is wired. */
export async function getSessionUser(): Promise<SessionUser | null> {
  return placeholderUser;
}
