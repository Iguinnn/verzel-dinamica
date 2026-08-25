import { currentUser, readSessionToken, SESSION_COOKIE } from "@/lib/server/auth";
import type { SessionUser } from "@/modules/auth/types";

export async function getSessionUser(): Promise<SessionUser | null> {
  const token = await readSessionToken();
  if (!token) {
    return null;
  }

  try {
    const { data } = await currentUser(`${SESSION_COOKIE}=${token}`);
    return {
      id: data.id,
      name: data.name,
      email: data.email,
      role: data.role,
    };
  } catch {
    return null;
  }
}
