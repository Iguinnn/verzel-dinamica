"use client";

import * as React from "react";
import type { Sector } from "@parking/contracts";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { confirmReservation } from "@/modules/reservations/lib/create-reservation";
import { getOccupiedSpots } from "@/modules/reservations/lib/occupancy";
import { validateReservationInput } from "@/modules/reservations/lib/reservation-input";
import { SpotGrid } from "@/modules/reservations/components/spot-grid";

type ReservationDialogProps = {
  /** `null` mantem o modal fechado e evita renderizar grade sem setor. */
  sector: Sector | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmed: (sectorId: string) => void;
};

export function ReservationDialog({
  sector,
  open,
  onOpenChange,
  onConfirmed,
}: ReservationDialogProps) {
  const [selectedSpot, setSelectedSpot] = React.useState<number | null>(null);
  const [plate, setPlate] = React.useState("");
  const [expectedArrival, setExpectedArrival] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  function resetForm() {
    setSelectedSpot(null);
    setPlate("");
    setExpectedArrival("");
    setError(null);
    setIsSubmitting(false);
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      resetForm();
    }

    onOpenChange(nextOpen);
  }

  async function handleConfirm() {
    if (!sector || selectedSpot === null) {
      return;
    }

    const validation = validateReservationInput({
      sectorId: sector.id,
      plate,
      expectedArrivalAt: expectedArrival,
    });

    if (!validation.ok) {
      setError(validation.message);
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await confirmReservation(validation.value);
      onConfirmed(sector.id);
      handleOpenChange(false);
    } catch {
      setError("Nao foi possivel confirmar a reserva.");
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        {sector ? (
          <>
            <DialogHeader>
              <DialogTitle>Reservar vaga em {sector.name}</DialogTitle>
              <DialogDescription>
                {sector.availableSpots} de {sector.capacity} vagas disponiveis.
                Escolha uma vaga livre e informe os dados do veiculo.
              </DialogDescription>
            </DialogHeader>

            <SpotGrid
              capacity={sector.capacity}
              occupiedSpots={getOccupiedSpots(sector)}
              selectedSpot={selectedSpot}
              onSelectSpot={setSelectedSpot}
            />

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="reservation-plate">Placa</Label>
                <Input
                  id="reservation-plate"
                  value={plate}
                  placeholder="ABC1D23"
                  autoComplete="off"
                  onChange={(event) => setPlate(event.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="reservation-arrival">Previsao de chegada</Label>
                <Input
                  id="reservation-arrival"
                  type="datetime-local"
                  value={expectedArrival}
                  onChange={(event) => setExpectedArrival(event.target.value)}
                />
              </div>
            </div>

            {error ? (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            ) : null}

            <DialogFooter>
              <DialogClose render={<Button variant="outline" />}>
                Cancelar
              </DialogClose>
              <Button
                onClick={handleConfirm}
                disabled={selectedSpot === null || isSubmitting}
              >
                Confirmar reserva
              </Button>
            </DialogFooter>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
