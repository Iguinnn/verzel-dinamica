import type { Sector } from "@parking/contracts";

/** A partir desta fracao de vagas ocupadas o setor entra em "Alta Ocup.". */
export const HIGH_OCCUPANCY_THRESHOLD = 0.8;

export type SectorState = "free" | "filling" | "full";

/** Vagas ja tomadas. O contrato expoe disponiveis, a tela mostra ocupadas. */
export function getOccupiedSpots(sector: Sector): number {
  return sector.capacity - sector.availableSpots;
}

/** Fracao ocupada entre 0 e 1, protegida contra capacidade zerada. */
export function getOccupancyRatio(sector: Sector): number {
  if (sector.capacity <= 0) {
    return 0;
  }

  return getOccupiedSpots(sector) / sector.capacity;
}

export function getSectorState(sector: Sector): SectorState {
  if (sector.availableSpots <= 0) {
    return "full";
  }

  return getOccupancyRatio(sector) >= HIGH_OCCUPANCY_THRESHOLD
    ? "filling"
    : "free";
}

type SectorStateStyle = {
  label: string;
  /**
   * `Badge` so tem variante para `destructive`. Os tokens `success` e `warning`
   * existem no tema, entao os outros dois estados repetem aqui o mesmo par de
   * classes que `badge.tsx` usa para `destructive`.
   */
  badgeVariant: "default" | "destructive" | "outline";
  badgeClassName: string;
  barClassName: string;
};

export const SECTOR_STATE_LABELS: Record<SectorState, SectorStateStyle> = {
  free: {
    label: "Livre",
    badgeVariant: "outline",
    badgeClassName: "border-transparent bg-success/10 text-success",
    barClassName: "bg-success",
  },
  filling: {
    label: "Alta Ocup.",
    badgeVariant: "outline",
    badgeClassName: "border-transparent bg-warning/10 text-warning",
    barClassName: "bg-warning",
  },
  full: {
    label: "Lotado",
    badgeVariant: "destructive",
    badgeClassName: "",
    barClassName: "bg-destructive",
  },
};
