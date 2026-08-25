import {
  apiErrorSchema,
  sectorListResponseSchema,
  sectorResponseSchema,
  type ApiError,
  type CreateSectorInput,
  type Sector,
  type SectorListResponse,
  type UpdateSectorInput,
} from "@parking/contracts";

export class SectorApiError extends Error {
  constructor(
    readonly status: number,
    readonly payload: ApiError,
  ) {
    super(payload.error.message);
  }
}

/** Converts an Express API failure into the BFF error response contract. */
export function sectorApiErrorResponse(error: unknown): Response {
  if (error instanceof SectorApiError) {
    return Response.json(error.payload, { status: error.status });
  }

  return Response.json(
    {
      error: {
        code: "SECTOR_API_UNAVAILABLE",
        message: "Nao foi possivel acessar a API de setores.",
      },
    },
    { status: 502 },
  );
}

function apiUrl(): string {
  return process.env.API_URL ?? "http://localhost:3333";
}

async function apiError(response: Response): Promise<SectorApiError> {
  const body: unknown = await response.json().catch(() => undefined);
  const parsed = apiErrorSchema.safeParse(body);

  if (parsed.success) {
    return new SectorApiError(response.status, parsed.data);
  }

  return new SectorApiError(502, {
    error: {
      code: "INVALID_SECTOR_API_RESPONSE",
      message: "A API de setores retornou uma resposta invalida.",
    },
  });
}

async function request(path: string, init?: RequestInit): Promise<Response> {
  const response = await fetch(`${apiUrl()}${path}`, {
    cache: "no-store",
    ...init,
  });

  if (!response.ok) {
    throw await apiError(response);
  }

  return response;
}

/** Lists sectors from the Express API and validates its response contract. */
export async function listSectors(): Promise<SectorListResponse> {
  const response = await request("/v1/sectors");
  return sectorListResponseSchema.parse(await response.json());
}

/** Reads one sector from the Express API. */
export async function getSector(id: string): Promise<Sector> {
  const response = await request(`/v1/sectors/${id}`);
  return sectorResponseSchema.parse(await response.json()).data;
}

/** Creates one sector through the Express API. */
export async function createSector(input: CreateSectorInput): Promise<Sector> {
  const response = await request("/v1/sectors", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  return sectorResponseSchema.parse(await response.json()).data;
}

/** Updates one sector through the Express API. */
export async function updateSector(
  id: string,
  input: UpdateSectorInput,
): Promise<Sector> {
  const response = await request(`/v1/sectors/${id}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  return sectorResponseSchema.parse(await response.json()).data;
}

/** Deletes one sector through the Express API. */
export async function deleteSector(id: string): Promise<void> {
  await request(`/v1/sectors/${id}`, { method: "DELETE" });
}
