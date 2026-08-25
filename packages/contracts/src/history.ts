import { z } from "zod";

import {
  reservationEventSchema,
  reservationEventTypeSchema,
  reservationStatusSchema,
} from "./reservations.js";

const plateSchema = z
  .string()
  .trim()
  .min(1, "Placa e obrigatoria.")
  .max(10, "Placa deve ter no maximo 10 caracteres.");

export const reservationHistoryEventSchema = reservationEventSchema
  .refine(
    (event) =>
      event.type !== "WAITLIST_PROMOTED" ||
      event.triggeredByReservationId !== null,
    {
      message:
        "Promocao da lista de espera deve indicar a reserva cujo cancelamento a originou.",
      path: ["triggeredByReservationId"],
    },
  );

/** Identificacao da reserva exibida no cabecalho do historico e na listagem. */
export const reservationSummarySchema = z.object({
  id: z.uuid(),
  plate: plateSchema,
  sectorId: z.uuid(),
  sectorName: z.string().trim().min(1).max(120),
  status: reservationStatusSchema,
  expectedArrivalAt: z.iso.datetime(),
  createdAt: z.iso.datetime(),
});

/**
 * Historico completo de uma reserva. A lista nunca e vazia: toda reserva tem
 * ao menos o evento de criacao.
 */
export const reservationHistorySchema = z.object({
  reservation: reservationSummarySchema,
  events: z
    .array(reservationHistoryEventSchema)
    .min(1, "Toda reserva tem ao menos o evento de criacao."),
});

/** Linha da listagem: a reserva e o resumo do seu historico. */
export const reservationHistorySummarySchema = z.object({
  reservation: reservationSummarySchema,
  eventCount: z.number().int().min(1),
  lastEventType: reservationEventTypeSchema,
  lastEventAt: z.iso.datetime(),
});

export const reservationHistoryListResponseSchema = z.object({
  data: z.array(reservationHistorySummarySchema),
});

export const reservationHistoryResponseSchema = z.object({
  data: reservationHistorySchema,
});

export type ReservationHistoryEvent = z.infer<
  typeof reservationHistoryEventSchema
>;
export type ReservationSummary = z.infer<typeof reservationSummarySchema>;
export type ReservationHistory = z.infer<typeof reservationHistorySchema>;
export type ReservationHistorySummary = z.infer<
  typeof reservationHistorySummarySchema
>;
export type ReservationHistoryListResponse = z.infer<
  typeof reservationHistoryListResponseSchema
>;
export type ReservationHistoryResponse = z.infer<
  typeof reservationHistoryResponseSchema
>;
