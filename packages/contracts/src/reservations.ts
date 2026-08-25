import { z } from "zod";

export const reservationStatusSchema = z.enum([
  "WAITLISTED",
  "ACTIVE",
  "CANCELLED",
  "LEFT_WAITLIST",
]);

export const reservationEventTypeSchema = z.enum([
  "RESERVATION_CREATED",
  "RESERVATION_CANCELLED",
  "WAITLIST_JOINED",
  "WAITLIST_LEFT",
  "WAITLIST_PROMOTED",
]);

export function normalizePlate(value: string): string {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

const plateSchema = z
  .string()
  .transform(normalizePlate)
  .pipe(
    z
      .string()
      .min(1, "Placa e obrigatoria.")
      .max(10, "Placa deve ter no maximo 10 caracteres."),
  );

export const reservationSchema = z.object({
  id: z.uuid(),
  userId: z.uuid(),
  sectorId: z.uuid(),
  plate: plateSchema,
  expectedArrivalAt: z.iso.datetime(),
  status: reservationStatusSchema,
  activatedAt: z.iso.datetime().nullable(),
  cancelledAt: z.iso.datetime().nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export const createReservationSchema = z.object({
  sectorId: z.uuid("Identificador de setor invalido."),
  plate: plateSchema,
  expectedArrivalAt: z
    .string()
    .min(1, "Data/hora prevista de chegada e obrigatoria.")
    .superRefine((value, context) => {
      const arrival = new Date(value);

      if (Number.isNaN(arrival.getTime())) {
        context.addIssue({
          code: "custom",
          message: "Data/hora prevista invalida.",
        });
        return;
      }

      if (arrival.getTime() <= Date.now()) {
        context.addIssue({
          code: "custom",
          message: "Data/hora prevista nao pode estar no passado.",
        });
      }
    })
    .transform((value) => new Date(value).toISOString()),
});

export const reservationIdSchema = z.uuid("Identificador de reserva invalido.");

export const reservationResponseSchema = z.object({
  data: reservationSchema,
});

export const reservationListResponseSchema = z.object({
  data: z.array(reservationSchema),
});

export const reservationEventSchema = z.object({
  id: z.uuid(),
  reservationId: z.uuid(),
  actorUserId: z.uuid().nullable(),
  type: reservationEventTypeSchema,
  occurredAt: z.iso.datetime(),
  triggeredByReservationId: z.uuid().nullable(),
  details: z.unknown().nullable(),
  description: z.string().min(1),
});

export const reservationEventListResponseSchema = z.object({
  data: z.array(reservationEventSchema),
});

export const cancelReservationResponseSchema = z.object({
  data: z.object({
    reservation: reservationSchema,
    promoted: reservationSchema.optional(),
  }),
});

export type ReservationStatus = z.infer<typeof reservationStatusSchema>;
export type ReservationEventType = z.infer<typeof reservationEventTypeSchema>;
export type Reservation = z.infer<typeof reservationSchema>;
export type CreateReservationInput = z.infer<typeof createReservationSchema>;
export type ReservationResponse = z.infer<typeof reservationResponseSchema>;
export type ReservationListResponse = z.infer<
  typeof reservationListResponseSchema
>;
export type ReservationEvent = z.infer<typeof reservationEventSchema>;
export type ReservationEventListResponse = z.infer<
  typeof reservationEventListResponseSchema
>;
export type CancelReservationResponse = z.infer<
  typeof cancelReservationResponseSchema
>;
