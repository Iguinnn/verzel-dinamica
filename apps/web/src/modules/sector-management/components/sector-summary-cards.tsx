import { CarFrontIcon, CircleParkingIcon, type LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { summarizeSectors } from "@/modules/sector-management/sector-status";
import type { Sector } from "@/modules/sector-management/types";

function SummaryCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
}) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
            {label}
          </span>
          <span className="text-3xl font-semibold tabular-nums">{value}</span>
        </div>
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <Icon className="size-4" />
        </span>
      </CardContent>
    </Card>
  );
}

/** Totais do pátio, derivados da listagem exibida ao lado. */
export function SectorSummaryCards({ sectors }: { sectors: Sector[] }) {
  const { availableSpots, occupancyRate } = summarizeSectors(sectors);

  return (
    <div className="flex flex-col gap-4">
      <SummaryCard
        label="Ocupação total"
        value={`${occupancyRate}%`}
        icon={CarFrontIcon}
      />
      <SummaryCard
        label="Vagas livres"
        value={String(availableSpots)}
        icon={CircleParkingIcon}
      />
    </div>
  );
}
