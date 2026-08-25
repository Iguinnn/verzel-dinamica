import { z } from "zod";

export const sectorSchema = z
  .object({
    id: z.uuid(),
    name: z.string().trim().min(1),
    location: z.string().trim().min(1),
    capacity: z.number().int().min(1),
    availableSpots: z.number().int().min(0),
    hourlyRate: z.number().min(0),
  })
  .refine((sector) => sector.availableSpots <= sector.capacity, {
    message: "Available spots cannot exceed capacity",
    path: ["availableSpots"],
  });

export const sectorListResponseSchema = z.object({
  data: z.array(sectorSchema),
});

export type Sector = z.infer<typeof sectorSchema>;
export type SectorListResponse = z.infer<typeof sectorListResponseSchema>;
