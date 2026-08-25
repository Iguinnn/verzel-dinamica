import { getReservationHistoryPageData } from "@/lib/server/history";
import { ReservationHistoryBrowser } from "@/modules/history/components/reservation-history-browser";
import type { ReservationHistory } from "@/modules/history/types";

/**
 * Histórico de reservas (ESTC-5): lista as reservas e abre a linha do tempo
 * de eventos de cada uma, da criação até a situação atual.
 */
export async function HistoryView() {
  const { summaries, histories } = await getReservationHistoryPageData();

  const historyById = histories.reduce<Record<string, ReservationHistory>>(
    (byId, history) => {
      byId[history.reservation.id] = history;
      return byId;
    },
    {},
  );

  return (
    <ReservationHistoryBrowser summaries={summaries} histories={historyById} />
  );
}
