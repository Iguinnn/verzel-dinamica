import type { Metadata } from "next";

import { WaitlistView } from "@/modules/waitlist/components/waitlist-view";

export const metadata: Metadata = {
  title: "Lista de espera",
};

export default function WaitlistPage() {
  return <WaitlistView />;
}
