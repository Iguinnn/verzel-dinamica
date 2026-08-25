import {
  sectorListResponseSchema,
  type SectorListResponse,
} from "@parking/contracts";

const sectorListMock: SectorListResponse = {
  data: [
    {
      id: "ed31bd55-cfb5-488e-bf63-14687db7390b",
      name: "Setor Central",
      location: "Entrada principal",
      capacity: 12,
      availableSpots: 4,
      hourlyRate: 8,
    },
    {
      id: "03aa526e-c7e6-4f66-bf51-a12a87d59c95",
      name: "Setor Norte",
      location: "Proximo a praca",
      capacity: 8,
      availableSpots: 0,
      hourlyRate: 6.5,
    },
  ],
};

/** Returns sectors from a contract-valid mock or from the Express API. */
export async function listSectors(): Promise<SectorListResponse> {
  if ((process.env.BACKEND_MODE ?? "mock") === "mock") {
    return sectorListResponseSchema.parse(sectorListMock);
  }

  const apiUrl = process.env.API_URL ?? "http://localhost:3333";
  const response = await fetch(`${apiUrl}/v1/sectors`, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`Sector API returned ${response.status}`);
  }

  return sectorListResponseSchema.parse(await response.json());
}
