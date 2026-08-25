import type {
  Sector,
  SectorQueue,
  WaitlistEntry,
} from "@/modules/waitlist/types";

/**
 * Ordena por `joined_at` e desempata por `id`, reproduzindo o índice
 * `waitlist_fifo_idx` do MER. O desempate mantém a ordem determinística
 * quando duas entradas caem no mesmo instante.
 */
function compareByArrivalInQueue(a: WaitlistEntry, b: WaitlistEntry): number {
  const byJoinedAt = a.joinedAt.localeCompare(b.joinedAt);

  return byJoinedAt !== 0 ? byJoinedAt : a.id.localeCompare(b.id);
}

/** Entradas que ainda aguardam no setor, em ordem de entrada. */
export function getSectorQueue(
  entries: WaitlistEntry[],
  sectorId: string,
): WaitlistEntry[] {
  return entries
    .filter((entry) => entry.sectorId === sectorId && entry.status === "WAITING")
    .sort(compareByArrivalInQueue);
}

/** Uma fila por setor, na mesma ordem em que os setores são listados. */
export function groupQueuesBySector(
  sectors: Sector[],
  entries: WaitlistEntry[],
): SectorQueue[] {
  return sectors.map((sector) => ({
    sector,
    entries: getSectorQueue(entries, sector.id),
  }));
}

/**
 * Setores sem cota disponível.
 *
 * São os únicos que aceitam entrada na fila: com vaga livre o motorista
 * reserva direto.
 */
export function getJoinableSectors(sectors: Sector[]): Sector[] {
  return sectors.filter((sector) => sector.availableSpots === 0);
}

/**
 * Registra a saída voluntária da fila.
 *
 * A entrada é marcada como `LEFT` em vez de removida, como no MER. Quem vem
 * depois avança sozinho, porque a posição é derivada da ordenação e não
 * armazenada.
 */
export function leaveQueue(
  entries: WaitlistEntry[],
  entryId: string,
  leftAt: string,
): WaitlistEntry[] {
  return entries.map((entry) =>
    entry.id === entryId ? { ...entry, status: "LEFT", leftAt } : entry,
  );
}
