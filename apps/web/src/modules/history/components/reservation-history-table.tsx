import { HistoryIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getEventPresentation } from "@/modules/history/event-presentation";
import { formatEventDateTime } from "@/modules/history/format";
import { ReservationStatusBadge } from "@/modules/history/components/reservation-status-badge";
import type { ReservationHistorySummary } from "@/modules/history/types";

type ReservationHistoryTableProps = {
  summaries: ReservationHistorySummary[];
  onOpenHistory: (reservationId: string) => void;
};

/** Listagem das reservas com histórico, mais recente primeiro. */
export function ReservationHistoryTable({
  summaries,
  onOpenHistory,
}: ReservationHistoryTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Reservas</CardTitle>
      </CardHeader>

      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Placa</TableHead>
              <TableHead>Setor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Criada em</TableHead>
              <TableHead>Último evento</TableHead>
              <TableHead className="w-0 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {summaries.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-10 text-center text-muted-foreground"
                >
                  Nenhuma reserva encontrada para essa busca.
                </TableCell>
              </TableRow>
            ) : (
              summaries.map(({ reservation, lastEventType, lastEventAt }) => (
                <TableRow key={reservation.id}>
                  <TableCell className="font-medium">
                    {reservation.plate}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {reservation.sectorName}
                  </TableCell>
                  <TableCell>
                    <ReservationStatusBadge status={reservation.status} />
                  </TableCell>
                  <TableCell className="text-muted-foreground tabular-nums">
                    {formatEventDateTime(reservation.createdAt)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {getEventPresentation(lastEventType).label}
                    <span className="ml-1 tabular-nums">
                      · {formatEventDateTime(lastEventAt)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onOpenHistory(reservation.id)}
                    >
                      <HistoryIcon data-icon="inline-start" />
                      Ver histórico
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
