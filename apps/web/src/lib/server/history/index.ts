import {
  reservationHistoryListResponseSchema,
  reservationHistorySchema,
  type Reservation,
  type ReservationHistory,
  type ReservationHistoryEvent,
  type ReservationHistorySummary,
  type Sector,
} from "@parking/contracts";

import {
  listReservationEvents,
  listReservations,
} from "@/lib/server/reservations";
import { listSectors } from "@/lib/server/sectors";

/**
 * Acesso server-side ao historico de reservas (ESTC-5).
 *
 * Combina as reservas visiveis para a sessao com seus setores e eventos. A API
 * aplica a autorizacao: USER recebe apenas as proprias reservas e ADMIN recebe
 * todas.
 */

/**
 * Ordem cronologica do historico: mais antigo primeiro, com o id desempatando
 * eventos no mesmo instante. Espelha o indice `reservation_events_timeline_idx`.
 */
function byOccurrence(
  a: ReservationHistoryEvent,
  b: ReservationHistoryEvent,
): number {
  return (
    Date.parse(a.occurredAt) - Date.parse(b.occurredAt) ||
    a.id.localeCompare(b.id)
  );
}

function sortEvents(history: ReservationHistory): ReservationHistory {
  return {
    reservation: history.reservation,
    events: [...history.events].sort(byOccurrence),
  };
}

function reservationSummary(
  reservation: Reservation,
  sector: Sector,
) {
  return {
    id: reservation.id,
    plate: reservation.plate,
    sectorId: reservation.sectorId,
    sectorName: sector.name,
    status: reservation.status,
    expectedArrivalAt: reservation.expectedArrivalAt,
    createdAt: reservation.createdAt,
  };
}

function summarize(
  history: ReservationHistory,
): ReservationHistorySummary | null {
  const lastEvent = history.events.at(-1);

  if (!lastEvent) {
    // O contrato garante ao menos o evento de criacao; sem ele nao ha resumo.
    return null;
  }

  return {
    reservation: history.reservation,
    eventCount: history.events.length,
    lastEventType: lastEvent.type,
    lastEventAt: lastEvent.occurredAt,
  };
}

export type ReservationHistoryPageData = {
  histories: ReservationHistory[];
  summaries: ReservationHistorySummary[];
};

/** Carrega a listagem e os historicos completos diretamente da API Express. */
export async function getReservationHistoryPageData(): Promise<
  ReservationHistoryPageData
> {
  const [{ data: reservations }, { data: sectors }] = await Promise.all([
    listReservations(),
    listSectors(),
  ]);
  const sectorsById = new Map(sectors.map((sector) => [sector.id, sector]));

  const histories = await Promise.all(
    reservations.map(async (reservation) => {
      const sector = sectorsById.get(reservation.sectorId);

      if (!sector) {
        throw new Error(`SECTOR_NOT_FOUND_FOR_RESERVATION:${reservation.id}`);
      }

      const { data: events } = await listReservationEvents(reservation.id);

      return sortEvents(
        reservationHistorySchema.parse({
          reservation: reservationSummary(reservation, sector),
          events,
        }),
      );
    }),
  );

  const summaries = histories
    .map(summarize)
    .filter((summary): summary is ReservationHistorySummary => summary !== null);

  const parsedSummaries = reservationHistoryListResponseSchema.parse({
    data: summaries.sort(
      (a, b) =>
        Date.parse(b.lastEventAt) - Date.parse(a.lastEventAt) ||
        a.reservation.plate.localeCompare(b.reservation.plate),
    ),
  }).data;

  return { histories, summaries: parsedSummaries };
}
