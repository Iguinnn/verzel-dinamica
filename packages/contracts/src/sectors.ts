import { z } from "zod";

const sectorNameSchema = z
  .string()
  .trim()
  .min(1, "Nome e obrigatorio.")
  .max(120, "Nome deve ter no maximo 120 caracteres.");

const sectorLocationSchema = z
  .string()
  .trim()
  .min(1, "Localizacao e obrigatoria.")
  .max(255, "Localizacao deve ter no maximo 255 caracteres.");

const sectorCapacitySchema = z
  .number()
  .int("Capacidade deve ser um numero inteiro.")
  .min(1, "Capacidade deve ser maior ou igual a 1.")
  .max(2_147_483_647, "Capacidade excede o limite permitido.");

const sectorHourlyRateSchema = z
  .number()
  .min(0, "Tarifa nao pode ser negativa.")
  .max(99_999_999.99, "Tarifa excede o limite permitido.")
  .multipleOf(0.01, "Tarifa deve ter no maximo duas casas decimais.");

export const sectorSchema = z
  .object({
    id: z.uuid(),
    name: sectorNameSchema,
    location: sectorLocationSchema,
    capacity: sectorCapacitySchema,
    availableSpots: z.number().int().min(0),
    hourlyRate: sectorHourlyRateSchema,
  })
  .refine((sector) => sector.availableSpots <= sector.capacity, {
    message: "Available spots cannot exceed capacity",
    path: ["availableSpots"],
  });

export const sectorListResponseSchema = z.object({
  data: z.array(sectorSchema),
});

export const sectorResponseSchema = z.object({
  data: sectorSchema,
});

export const createSectorSchema = z.object({
  name: sectorNameSchema,
  location: sectorLocationSchema,
  capacity: sectorCapacitySchema,
  hourlyRate: sectorHourlyRateSchema,
});

export const updateSectorSchema = createSectorSchema.partial().refine(
  (input) => Object.keys(input).length > 0,
  { message: "Informe ao menos um campo para atualizar." },
);

export const sectorIdSchema = z.uuid("Identificador de setor invalido.");

export type Sector = z.infer<typeof sectorSchema>;
export type SectorListResponse = z.infer<typeof sectorListResponseSchema>;
export type SectorResponse = z.infer<typeof sectorResponseSchema>;
export type CreateSectorInput = z.infer<typeof createSectorSchema>;
export type UpdateSectorInput = z.infer<typeof updateSectorSchema>;
