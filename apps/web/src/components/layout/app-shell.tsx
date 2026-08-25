import type * as React from "react";

import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppTopbar } from "@/components/layout/app-topbar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import type { SessionUser } from "@/modules/auth/types";

/**
 * Authenticated chrome: sidebar navigation plus the account topbar.
 *
 * Every route except `/login` renders inside this shell.
 */
export function AppShell({
  user,
  children,
}: {
  user: SessionUser;
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <AppTopbar user={user} />
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
