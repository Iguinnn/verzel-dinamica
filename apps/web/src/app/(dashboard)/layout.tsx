import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { routes } from "@/config/site";
import { getSessionUser } from "@/modules/auth/session";

/**
 * Wraps every authenticated route in the app shell.
 *
 * The guard below is the only place a route group checks for a session, so
 * enforcing real authentication means implementing `getSessionUser`.
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();

  if (!user) {
    redirect(routes.login);
  }

  return <AppShell user={user}>{children}</AppShell>;
}
