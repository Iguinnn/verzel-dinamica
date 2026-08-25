import { LockIcon, MailIcon, UserIcon } from "lucide-react";
import Link from "next/link";

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
import { routes } from "@/config/site";
import { signUpAction } from "@/modules/auth/actions";

/** Public form for creating a driver account. */
export function SignUpForm() {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Create account</CardTitle>
        <CardDescription>
          Register to reserve spots and join waiting lists.
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
              maxLength={120}
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
              <LockIcon className="size-3.5 text-muted-foreground" />
              Password
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              placeholder="At least 8 characters"
              minLength={8}
              maxLength={128}
              required
            />
          </div>

          <Button type="submit" size="lg" className="mt-2 w-full">
            Sign up
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            href={routes.login}
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
