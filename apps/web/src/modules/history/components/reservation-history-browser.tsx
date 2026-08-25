"use client";

import * as React from "react";

import { PageHeader } from "@/components/common/page-header";
import { PageShell } from "@/components/common/page-shell";
import { HistorySearch } from "@/modules/history/components/history-search";
import { HistoryTimelineDialog } from "@/modules/history/components/history-timeline-dialog";
import { ReservationHistoryTable } from "@/modules/history/components/reservation-history-table";
import type {
  ReservationHistory,
  ReservationHistorySummary,
} from "@/modules/history/types";

type ReservationHistoryBrowserProps = {
  summaries: ReservationHistorySummary[];
  /** Indexado por reservation id para abrir o histórico sem nova busca. */
  histories: Record<string, ReservationHistory>;
};

function matchesQuery(
  summary: ReservationHistorySummary,
  query: string,
): boolean {
  const needle = query.trim().toLowerCase();

  if (needle === "") {
    return true;
  }

  return (
    summary.reservation.plate.toLowerCase().includes(needle) ||
    summary.reservation.sectorName.toLowerCase().includes(needle)
  );
}

/**
 * Tela de histórico (ESTC-5): busca, listagem de reservas e o detalhe
 * cronológico de cada uma em um diálogo.
 */
export function ReservationHistoryBrowser({
  summaries,
  histories,
}: ReservationHistoryBrowserProps) {
  const [query, setQuery] = React.useState("");
  const [openReservationId, setOpenReservationId] = React.useState<
    string | null
  >(null);

  const filtered = summaries.filter((summary) => matchesQuery(summary, query));
  const openHistory = openReservationId
    ? histories[openReservationId]
    : undefined;

  return (
    <PageShell>
      <PageHeader
        title="Histórico"
        description="Consulte os eventos de cada reserva, da criação até a situação atual."
        actions={<HistorySearch value={query} onValueChange={setQuery} />}
      />

      <ReservationHistoryTable
        summaries={filtered}
        onOpenHistory={setOpenReservationId}
      />

      <HistoryTimelineDialog
        history={openHistory}
        onOpenChange={(open) => !open && setOpenReservationId(null)}
      />
    </PageShell>
  );
}
