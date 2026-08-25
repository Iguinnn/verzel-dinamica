import { z } from "zod";

import { normalizePlate } from "./reservations.js";

const normalizedPlateSchema = z
  .string()
  .transform(normalizePlate)
  .pipe(
    z
      .string()
      .min(1, "Placa e obrigatoria.")
      .max(10, "Placa deve ter no maximo 10 caracteres."),
  );

export const joinWaitlistSchema = z.object({
  plate: normalizedPlateSchema,
  expectedArrivalAt: z.iso.datetime({
    message: "Data prevista de chegada invalida.",
  }),
});

export const waitlistEntryIdSchema = z.uuid(
  "Identificador da entrada na fila invalido.",
);

export const waitlistEntrySchema = z.object({
  id: z.uuid(),
  sectorId: z.uuid(),
  position: z.number().int().positive(),
  maskedPlate: z.string().min(1),
  isMine: z.boolean(),
  expectedArrivalAt: z.iso.datetime(),
  joinedAt: z.iso.datetime(),
});

export const waitlistEntryResponseSchema = z.object({
  data: waitlistEntrySchema,
});

export const waitlistListResponseSchema = z.object({
  data: z.array(waitlistEntrySchema),
});

export type JoinWaitlistInput = z.infer<typeof joinWaitlistSchema>;
export type WaitlistEntry = z.infer<typeof waitlistEntrySchema>;
export type WaitlistEntryResponse = z.infer<
  typeof waitlistEntryResponseSchema
>;
export type WaitlistListResponse = z.infer<typeof waitlistListResponseSchema>;
