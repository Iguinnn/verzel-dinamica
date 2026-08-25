"use client";

import type { Sector } from "@parking/contracts";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  SECTOR_STATE_LABELS,
  getOccupancyRatio,
  getOccupiedSpots,
  getSectorState,
} from "@/modules/reservations/lib/occupancy";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

type SectorCardProps = {
  sector: Sector;
  onReserve: (sector: Sector) => void;
};

export function SectorCard({ sector, onReserve }: SectorCardProps) {
  const state = getSectorState(sector);
  const style = SECTOR_STATE_LABELS[state];
  const occupied = getOccupiedSpots(sector);
  const ratio = getOccupancyRatio(sector);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{sector.name}</CardTitle>
        <CardDescription>
          {sector.location} · {currencyFormatter.format(sector.hourlyRate)}/h
        </CardDescription>
        <CardAction>
          <Badge variant={style.badgeVariant} className={style.badgeClassName}>
            {style.label}
          </Badge>
        </CardAction>
      </CardHeader>

      <CardContent className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between text-sm">
          <span className="text-muted-foreground">Cota atual</span>
          <span className="font-medium tabular-nums">
            {occupied} / {sector.capacity}
          </span>
        </div>

        <div
          role="progressbar"
          aria-label={`Ocupacao do setor ${sector.name}`}
          aria-valuenow={occupied}
          aria-valuemin={0}
          aria-valuemax={sector.capacity}
          className="h-2 w-full overflow-hidden rounded-full bg-muted"
        >
          <div
            className={cn("h-full rounded-full transition-all", style.barClassName)}
            style={{ width: `${ratio * 100}%` }}
          />
        </div>

        {state === "full" ? (
          <Button
            variant="outline"
            disabled
            title="A entrada na fila chega com a tela de lista de espera (ESTC-4)."
          >
            Entrar na lista de espera
          </Button>
        ) : (
          <Button onClick={() => onReserve(sector)}>Reservar vaga</Button>
        )}
      </CardContent>
    </Card>
  );
}
