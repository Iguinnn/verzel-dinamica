import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { routes } from "@/config/site";
import { RegisterView } from "@/modules/auth/components/register-view";
import { getSessionUser } from "@/modules/auth/session";

export const metadata: Metadata = {
  title: "Create account",
};

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await getSessionUser();
  if (user) {
    redirect(routes.dashboard);
  }

  const { error } = await searchParams;
  const knownError = error === "mismatch" || error === "failed" ? error : undefined;

  return <RegisterView error={knownError} />;
}
