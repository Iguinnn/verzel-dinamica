"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { HistoryTimeline } from "@/modules/history/components/history-timeline";
import { ReservationStatusBadge } from "@/modules/history/components/reservation-status-badge";
import type { ReservationHistory } from "@/modules/history/types";

type HistoryTimelineDialogProps = {
  history: ReservationHistory | undefined;
  onOpenChange: (open: boolean) => void;
};

/** Histórico completo de uma reserva, aberto a partir da listagem. */
export function HistoryTimelineDialog({
  history,
  onOpenChange,
}: HistoryTimelineDialogProps) {
  return (
    <Dialog open={history !== undefined} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {history ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                Placa {history.reservation.plate}
                <ReservationStatusBadge status={history.reservation.status} />
              </DialogTitle>
              <DialogDescription>
                {history.reservation.sectorName}
              </DialogDescription>
            </DialogHeader>

            <div className="max-h-[60vh] overflow-y-auto pt-2">
              <HistoryTimeline events={history.events} />
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
