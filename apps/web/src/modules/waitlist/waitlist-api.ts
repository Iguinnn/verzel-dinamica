import {
  apiErrorSchema,
  sectorListResponseSchema,
  waitlistEntryResponseSchema,
  waitlistListResponseSchema,
  type JoinWaitlistInput,
  type Sector,
  type WaitlistEntry,
} from "@parking/contracts";

async function request(path: string, init?: RequestInit): Promise<unknown> {
  const response = await fetch(path, { cache: "no-store", ...init });
  const payload: unknown =
    response.status === 204
      ? undefined
      : await response.json().catch(() => undefined);

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

/** Setores do pátio, usados para montar uma fila por setor. */
export async function listSectors(signal?: AbortSignal): Promise<Sector[]> {
  const result = sectorListResponseSchema.safeParse(
    await request("/api/sectors", { signal }),
  );

  if (!result.success) {
    throw new Error("O servidor retornou uma lista de setores inválida.");
  }

  return result.data.data;
}

/** Fila de um setor. A API já devolve ordenada, com posição e placa mascarada. */
export async function listSectorWaitlist(
  sectorId: string,
  signal?: AbortSignal,
): Promise<WaitlistEntry[]> {
  const result = waitlistListResponseSchema.safeParse(
    await request(`/api/sectors/${sectorId}/waitlist`, { signal }),
  );

  if (!result.success) {
    throw new Error("O servidor retornou uma fila inválida.");
  }

  return result.data.data;
}

/** Entra na fila de um setor lotado. */
export async function joinWaitlist(
  sectorId: string,
  input: JoinWaitlistInput,
): Promise<WaitlistEntry> {
  const result = waitlistEntryResponseSchema.safeParse(
    await request(`/api/sectors/${sectorId}/waitlist`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
    }),
  );

  if (!result.success) {
    throw new Error("O servidor retornou uma entrada de fila inválida.");
  }

  return result.data.data;
}

/** Saída voluntária da fila. */
export async function leaveWaitlist(entryId: string): Promise<void> {
  await request(`/api/waitlist/${entryId}`, { method: "DELETE" });
}
