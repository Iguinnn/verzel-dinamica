/**
 * View model consumed by the app shell (profile menu, greetings, role gates).
 *
 * This is intentionally a frontend-only shape. When the real session lands it
 * should be mapped into this type inside `session.ts` rather than leaking the
 * backend payload into components.
 */
export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

export type UserRole = "ADMIN" | "USER";

/** Initials rendered in the avatar fallback when there is no picture. */
export function getUserInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return "?";
  }

  const first = parts[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1] ?? "") : "";

  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
}

/** Human-readable label for a role badge. */
export const roleLabels: Record<UserRole, string> = {
  ADMIN: "Administrator",
  USER: "Driver",
};
