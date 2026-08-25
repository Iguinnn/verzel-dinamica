"use client";

import * as React from "react";
import { SearchIcon } from "lucide-react";
import type { Sector } from "@parking/contracts";

import { Input } from "@/components/ui/input";
import { ReservationDialog } from "@/modules/reservations/components/reservation-dialog";
import { SectorCard } from "@/modules/reservations/components/sector-card";

type SectorBoardProps = {
  sectors: Sector[];
};

export function SectorBoard({ sectors }: SectorBoardProps) {
  /**
   * A confirmacao vive so nesta sessao enquanto `POST /v1/reservations` nao
   * existe, entao o board mantem a propria copia dos setores e decrementa a
   * cota localmente. Recarregar a pagina devolve os numeros do banco.
   */
  const [board, setBoard] = React.useState(sectors);
  const [syncedSectors, setSyncedSectors] = React.useState(sectors);
  const [search, setSearch] = React.useState("");
  const [reservingSectorId, setReservingSectorId] = React.useState<
    string | null
  >(null);

  // Um novo retorno do servidor descarta as reservas locais desta sessao.
  // Ajustar estado durante o render evita o render em cascata de um efeito.
  if (syncedSectors !== sectors) {
    setSyncedSectors(sectors);
    setBoard(sectors);
  }

  const term = search.trim().toLowerCase();
  const visibleSectors = term
    ? board.filter(
        (sector) =>
          sector.name.toLowerCase().includes(term) ||
          sector.location.toLowerCase().includes(term),
      )
    : board;

  const reservingSector =
    board.find((sector) => sector.id === reservingSectorId) ?? null;

  function handleConfirmed(sectorId: string) {
    setBoard((current) =>
      current.map((sector) =>
        sector.id === sectorId
          ? {
              ...sector,
              availableSpots: Math.max(0, sector.availableSpots - 1),
            }
          : sector,
      ),
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="relative max-w-sm">
        <SearchIcon
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar por setor ou localizacao"
          aria-label="Buscar setor"
          className="pl-8"
        />
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-muted-foreground">
          Setores disponiveis
        </h2>

        {visibleSectors.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            Nenhum setor corresponde a &quot;{search.trim()}&quot;.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {visibleSectors.map((sector) => (
              <SectorCard
                key={sector.id}
                sector={sector}
                onReserve={(target) => setReservingSectorId(target.id)}
              />
            ))}
          </div>
        )}
      </section>

      <ReservationDialog
        sector={reservingSector}
        open={reservingSector !== null}
        onOpenChange={(open) => {
          if (!open) {
            setReservingSectorId(null);
          }
        }}
        onConfirmed={handleConfirmed}
      />
    </div>
  );
}
