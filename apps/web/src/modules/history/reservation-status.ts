import type { ReservationStatus } from "@/modules/history/types";

/**
 * Apresentação do status da reserva. Mesmo princípio de
 * `sector-management/components/sector-status-badge.tsx`: cor só onde carrega
 * significado, no restante a paleta é monocromática.
 */
const reservationStatusPresentation: Record<
  ReservationStatus,
  { label: string; className: string }
> = {
  ACTIVE: { label: "Ativa", className: "bg-success/10 text-success" },
  WAITLISTED: { label: "Na lista de espera", className: "bg-warning/10 text-warning" },
  CANCELLED: { label: "Cancelada", className: "bg-destructive/10 text-destructive" },
  LEFT_WAITLIST: {
    label: "Saiu da lista de espera",
    className: "bg-muted text-muted-foreground",
  },
};

export function getReservationStatusPresentation(status: ReservationStatus) {
  return reservationStatusPresentation[status];
}
