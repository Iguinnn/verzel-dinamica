import { CircleParkingIcon } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { routes, site } from "@/config/site";
import { RegisterForm } from "@/modules/auth/components/register-form";

type RegisterError = "mismatch" | "failed" | undefined;

const errorMessages: Record<NonNullable<RegisterError>, string> = {
  mismatch: "Passwords do not match.",
  failed: "Could not create the account. The email may already be in use.",
};

export function RegisterView({ error }: { error?: RegisterError }) {
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
        <p className="text-sm text-destructive">{errorMessages[error]}</p>
      ) : null}

      <RegisterForm />

      <p className="text-xs text-muted-foreground">
        Already have an account?{" "}
        <Button
          variant="link"
          className="h-auto p-0 text-xs"
          render={<Link href={routes.login} />}
        >
          Sign in
        </Button>
      </p>
    </main>
  );
}
