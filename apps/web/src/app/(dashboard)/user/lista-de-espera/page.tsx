import type { Metadata } from "next";

import { getSessionUser } from "@/modules/auth/session";
import { WaitlistView } from "@/modules/waitlist/components/waitlist-view";

export const metadata: Metadata = {
  title: "Lista de espera",
};

export default async function WaitlistPage() {
  // O layout do grupo já garante a sessão; aqui só precisamos do dono da fila.
  const user = await getSessionUser();

  return <WaitlistView currentUserId={user?.id ?? ""} />;
}
