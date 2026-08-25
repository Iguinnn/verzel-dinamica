import type { Metadata } from "next";

import { ReservationsView } from "@/modules/reservations/components/reservations-view";

export const metadata: Metadata = {
  title: "Reservas",
};

export default function ReservationsPage() {
  return <ReservationsView />;
}
