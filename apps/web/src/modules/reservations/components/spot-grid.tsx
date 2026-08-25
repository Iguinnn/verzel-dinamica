"use client";

import { cn } from "@/lib/utils";

type SpotGridProps = {
  capacity: number;
  /** As primeiras `occupiedSpots` celulas aparecem tomadas. */
  occupiedSpots: number;
  selectedSpot: number | null;
  onSelectSpot: (spot: number) => void;
};

/**
 * Grade estilo mapa de assentos. A vaga escolhida e affordance de interface: o
 * banco guarda apenas contadores por setor, sem entidade de vaga individual,
 * entao a selecao nao e persistida nem enviada.
 */
export function SpotGrid({
  capacity,
  occupiedSpots,
  selectedSpot,
  onSelectSpot,
}: SpotGridProps) {
  return (
    <div className="max-h-56 overflow-y-auto rounded-lg border border-border p-2">
      <div className="grid grid-cols-[repeat(auto-fill,minmax(2.5rem,1fr))] gap-1.5">
        {Array.from({ length: capacity }, (_, index) => {
          const spot = index + 1;
          const isOccupied = index < occupiedSpots;
          const isSelected = selectedSpot === spot;

          return (
            <button
              key={spot}
              type="button"
              disabled={isOccupied}
              aria-pressed={isSelected}
              aria-label={
                isOccupied ? `Vaga ${spot}, ocupada` : `Vaga ${spot}, livre`
              }
              onClick={() => onSelectSpot(spot)}
              className={cn(
                "h-9 rounded-md border border-border text-xs font-medium transition-colors",
                "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                isOccupied &&
                  "cursor-not-allowed border-transparent bg-muted text-muted-foreground opacity-60",
                !isOccupied && !isSelected && "hover:bg-muted",
                isSelected &&
                  "border-transparent bg-primary text-primary-foreground",
              )}
            >
              {spot}
            </button>
          );
        })}
      </div>
    </div>
  );
}
