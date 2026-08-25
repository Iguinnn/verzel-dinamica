import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { routes } from "@/config/site";
import { LoginView } from "@/modules/auth/components/login-view";
import { getSessionUser } from "@/modules/auth/session";

export const metadata: Metadata = {
  title: "Sign in",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await getSessionUser();
  if (user) {
    redirect(routes.dashboard);
  }

  const { error } = await searchParams;
  return <LoginView error={error === "invalid"} />;
}
