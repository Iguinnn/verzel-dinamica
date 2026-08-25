import {
  reservationHistoryListResponseSchema,
  reservationHistorySchema,
  type ReservationHistory,
  type ReservationHistoryEvent,
  type ReservationHistorySummary,
} from "@parking/contracts";

import { mockReservationHistories } from "@/lib/server/history/mock-data";

/**
 * Acesso server-side ao historico de reservas (ESTC-5).
 *
 * Hoje le o mock de `mock-data.ts` e valida contra os contratos compartilhados,
 * de modo que o dado mockado nunca saia do formato que a API vai devolver.
 *
 * TODO(backend): trocar o corpo destas funcoes por `fetch` em
 * `GET /v1/reservations` e `GET /v1/reservations/:id/events`, seguindo o
 * mapeamento de erro de `lib/server/sectors.ts`, e filtrar por sessao
 * (USER ve apenas as proprias reservas, ADMIN ve todas).
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

/** Historicos completos, com os eventos de cada reserva em ordem cronologica. */
export async function listReservationHistories(): Promise<ReservationHistory[]> {
  return mockReservationHistories.map((history) =>
    sortEvents(reservationHistorySchema.parse(history)),
  );
}

/**
 * Linhas da listagem, da reserva com atividade mais recente para a mais antiga.
 * A placa desempata para a ordem nao depender da ordem do array de origem.
 */
export async function listReservationHistorySummaries(): Promise<
  ReservationHistorySummary[]
> {
  const summaries = (await listReservationHistories())
    .map(summarize)
    .filter((summary): summary is ReservationHistorySummary => summary !== null);

  return reservationHistoryListResponseSchema.parse({
    data: summaries.sort(
      (a, b) =>
        Date.parse(b.lastEventAt) - Date.parse(a.lastEventAt) ||
        a.reservation.plate.localeCompare(b.reservation.plate),
    ),
  }).data;
}

/** Historico de uma reserva. `null` quando o identificador nao existe. */
export async function getReservationHistory(
  id: string,
): Promise<ReservationHistory | null> {
  const histories = await listReservationHistories();

  return histories.find((history) => history.reservation.id === id) ?? null;
}
