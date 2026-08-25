import { LockIcon, MailIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signInAction } from "@/modules/auth/actions";

/**
 * Credentials form for the login screen.
 *
 * Markup and validation attributes only — the submit target is a placeholder
 * Server Action until authentication is implemented.
 */
export function LoginForm() {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Sign in</CardTitle>
        <CardDescription>
          Enter your credentials to access the parking console.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form action={signInAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">
              <MailIcon className="size-3.5 text-muted-foreground" />
              Email
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@parkflow.local"
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="password">
              <LockIcon className="size-3.5 text-muted-foreground" />
              Password
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              required
            />
          </div>

          <Button type="submit" size="lg" className="mt-2 w-full">
            Sign in
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
