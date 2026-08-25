import { LockKeyholeIcon, MailIcon, UserIcon } from "lucide-react";

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
import { signUpAction } from "@/modules/auth/actions";

/**
 * Account creation form.
 *
 * Markup and validation attributes only, mirroring `LoginForm` — the submit
 * target is the `signUpAction` Server Action.
 */
export function RegisterForm() {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Create account</CardTitle>
        <CardDescription>
          Fill in your details to access the parking console.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form action={signUpAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">
              <UserIcon className="size-3.5 text-muted-foreground" />
              Name
            </Label>
            <Input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              placeholder="Jane Driver"
              required
            />
          </div>

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
              <LockKeyholeIcon className="size-3.5 text-muted-foreground" />
              Password
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              minLength={8}
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="confirmPassword">
              <LockKeyholeIcon className="size-3.5 text-muted-foreground" />
              Confirm password
            </Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              minLength={8}
              required
            />
          </div>

          <Button type="submit" size="lg" className="mt-2 w-full">
            Create account
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
