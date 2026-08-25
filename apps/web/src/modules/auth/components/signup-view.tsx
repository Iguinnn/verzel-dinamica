import { CircleParkingIcon } from "lucide-react";

import { site } from "@/config/site";
import { SignUpForm } from "@/modules/auth/components/signup-form";

const signupErrors = {
  invalid: "Check your name, email and password (at least 8 characters).",
  exists: "An account with this email already exists.",
  failed: "Could not create the account. Try again.",
} as const;

export type SignUpError = keyof typeof signupErrors;

export function SignUpView({ error }: { error?: SignUpError }) {
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

      {error ? (
        <p className="text-sm text-destructive">{signupErrors[error]}</p>
      ) : null}

      <SignUpForm />

      <p className="text-xs text-muted-foreground">
        {site.tagline} · Create your account
      </p>
    </main>
  );
}
