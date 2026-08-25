import type { Sector, SectorStatus } from "@/modules/sector-management/types";

/** A partir deste percentual de ocupação o setor entra em atenção. */
const ATTENTION_THRESHOLD = 80;

/** Vagas atualmente ocupadas do setor. */
export function getOccupiedSpots(sector: Sector): number {
  return sector.capacity - sector.availableSpots;
}

/** Percentual de ocupação do setor, arredondado. */
export function getOccupancyRate(sector: Sector): number {
  if (sector.capacity === 0) {
    return 0;
  }

  return Math.round((getOccupiedSpots(sector) / sector.capacity) * 100);
}

/** Classifica o setor entre livre, atenção e lotado. */
export function getSectorStatus(sector: Sector): SectorStatus {
  if (sector.availableSpots === 0) {
    return "lotado";
  }

  return getOccupancyRate(sector) >= ATTENTION_THRESHOLD ? "atencao" : "livre";
}

/** Totais do pátio exibidos nos cartões de resumo. */
export function summarizeSectors(sectors: Sector[]) {
  const capacity = sectors.reduce((total, sector) => total + sector.capacity, 0);
  const availableSpots = sectors.reduce(
    (total, sector) => total + sector.availableSpots,
    0,
  );

  return {
    capacity,
    availableSpots,
    occupancyRate:
      capacity === 0
        ? 0
        : Math.round(((capacity - availableSpots) / capacity) * 100),
  };
}
