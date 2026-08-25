import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { routes } from "@/config/site";
import {
  SignUpView,
  type SignUpError,
} from "@/modules/auth/components/signup-view";
import { getSessionUser } from "@/modules/auth/session";

export const metadata: Metadata = {
  title: "Sign up",
};

function signupError(value?: string): SignUpError | undefined {
  if (value === "invalid" || value === "exists" || value === "failed") {
    return value;
  }

  return undefined;
}

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await getSessionUser();
  if (user) {
    redirect(routes.dashboard);
  }

  const { error } = await searchParams;
  return <SignUpView error={signupError(error)} />;
}
