import {
  apiErrorSchema,
  createSectorSchema,
  sectorListResponseSchema,
  sectorResponseSchema,
  updateSectorSchema,
  type CreateSectorInput,
  type Sector,
  type UpdateSectorInput,
} from "@parking/contracts";

async function responsePayload(response: Response): Promise<unknown> {
  return response.status === 204
    ? undefined
    : response.json().catch(() => undefined);
}

async function request(path: string, init?: RequestInit): Promise<unknown> {
  const response = await fetch(path, {
    cache: "no-store",
    ...init,
  });
  const payload = await responsePayload(response);

  if (!response.ok) {
    const error = apiErrorSchema.safeParse(payload);
    throw new Error(
      error.success
        ? error.data.error.message
        : "O servidor retornou uma resposta inválida.",
    );
  }

  return payload;
}

/** Lista os setores pelo BFF e valida a resposta compartilhada. */
export async function listSectors(signal?: AbortSignal): Promise<Sector[]> {
  const payload = await request("/api/sectors", { signal });
  const result = sectorListResponseSchema.safeParse(payload);

  if (!result.success) {
    throw new Error("O servidor retornou uma lista de setores inválida.");
  }

  return result.data.data;
}

/** Cadastra um setor pelo BFF. */
export async function createSector(
  input: CreateSectorInput,
): Promise<Sector> {
  const body = createSectorSchema.parse(input);
  const payload = await request("/api/sectors", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const result = sectorResponseSchema.safeParse(payload);

  if (!result.success) {
    throw new Error("O servidor retornou um setor inválido.");
  }

  return result.data.data;
}

/** Atualiza um setor pelo BFF. */
export async function updateSector(
  id: string,
  input: UpdateSectorInput,
): Promise<Sector> {
  const body = updateSectorSchema.parse(input);
  const payload = await request(`/api/sectors/${id}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const result = sectorResponseSchema.safeParse(payload);

  if (!result.success) {
    throw new Error("O servidor retornou um setor inválido.");
  }

  return result.data.data;
}

/** Exclui um setor pelo BFF. */
export async function deleteSector(id: string): Promise<void> {
  await request(`/api/sectors/${id}`, { method: "DELETE" });
}
