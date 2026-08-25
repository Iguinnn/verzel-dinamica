import { UserMenu } from "@/components/layout/user-menu";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { site } from "@/config/site";
import type { SessionUser } from "@/modules/auth/types";

/**
 * Sticky header of the app shell: sidebar toggle on the leading edge, account
 * menu on the trailing edge.
 */
export function AppTopbar({ user }: { user: SessionUser }) {
  return (
    <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur">
      <SidebarTrigger />
      <Separator orientation="vertical" className="h-5" />
      <span className="text-sm font-medium">{site.name}</span>
      <div className="ml-auto flex items-center gap-2">
        <UserMenu user={user} />
      </div>
    </header>
  );
}
