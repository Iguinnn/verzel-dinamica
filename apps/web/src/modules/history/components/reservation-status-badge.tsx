import { Badge } from "@/components/ui/badge";
import { getReservationStatusPresentation } from "@/modules/history/reservation-status";
import type { ReservationStatus } from "@/modules/history/types";

/** Selo de status da reserva (ativa, na fila, cancelada, saiu da fila). */
export function ReservationStatusBadge({
  status,
}: {
  status: ReservationStatus;
}) {
  const { label, className } = getReservationStatusPresentation(status);

  return (
    <Badge variant="secondary" className={className}>
      {label}
    </Badge>
  );
}
