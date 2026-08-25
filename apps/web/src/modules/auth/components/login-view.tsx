import { CircleParkingIcon } from "lucide-react";

import { site } from "@/config/site";
import { LoginForm } from "@/modules/auth/components/login-form";

/**
 * Login screen. Rendered outside the app shell, so it has no sidebar and no
 * account menu.
 */
export function LoginView() {
  return (
    <main className="ds-aurora flex min-h-svh flex-col items-center justify-center gap-8 bg-sidebar p-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <span className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <CircleParkingIcon className="size-6" />
        </span>
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold tracking-tight">{site.name}</h1>
          <p className="text-sm text-muted-foreground">{site.description}</p>
        </div>
      </div>

      <LoginForm />

      <p className="text-xs text-muted-foreground">
        {site.tagline} · Restricted access
      </p>
    </main>
  );
}
