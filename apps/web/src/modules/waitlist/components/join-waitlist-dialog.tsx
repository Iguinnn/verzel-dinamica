"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  validateWaitlistDraft,
} from "@/modules/waitlist/waitlist-form";
import {
  emptyWaitlistDraft,
  type Sector,
  type WaitlistDraft,
  type WaitlistDraftErrors,
  type WaitlistEntry,
} from "@/modules/waitlist/types";

type JoinWaitlistDialogProps = {
  onOpenChange: (open: boolean) => void;
  /** Apenas setores sem cota disponível aceitam entrada na fila. */
  joinableSectors: Sector[];
  activePlates: string[];
  entries: WaitlistEntry[];
  onSubmit: (draft: WaitlistDraft) => void;
};

/**
 * Formulário de entrada na lista de espera.
 *
 * Montado apenas enquanto aberto, para que cada abertura comece limpa.
 */
export function JoinWaitlistDialog({
  onOpenChange,
  joinableSectors,
  activePlates,
  entries,
  onSubmit,
}: JoinWaitlistDialogProps) {
  const [draft, setDraft] = React.useState<WaitlistDraft>(emptyWaitlistDraft);
  const [errors, setErrors] = React.useState<WaitlistDraftErrors>({});

  function handleChange(field: keyof WaitlistDraft, value: string) {
    setDraft((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors = validateWaitlistDraft(draft, {
      activePlates,
      entries,
      now: new Date(),
    });

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    onSubmit(draft);
  }

  const hasJoinableSector = joinableSectors.length > 0;

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Entrar na lista de espera</DialogTitle>
          <DialogDescription>
            Entrar na fila não consome vaga. Você é contemplado
            automaticamente quando alguém cancelar.
          </DialogDescription>
        </DialogHeader>

        {hasJoinableSector ? (
          <form
            id="join-waitlist-form"
            onSubmit={handleSubmit}
            noValidate
            className="flex flex-col gap-4"
          >
            <div className="flex flex-col gap-2">
              <Label htmlFor="sectorId">Setor</Label>
              <Select
                value={draft.sectorId}
                onValueChange={(value) =>
                  handleChange("sectorId", String(value))
                }
              >
                <SelectTrigger
                  id="sectorId"
                  className="w-full"
                  aria-invalid={errors.sectorId ? true : undefined}
                >
                  <SelectValue>
                    {(value) =>
                      joinableSectors.find((sector) => sector.id === value)
                        ?.name ?? "Selecione o setor lotado"
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {joinableSectors.map((sector) => (
                    <SelectItem key={sector.id} value={sector.id}>
                      {sector.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.sectorId ? (
                <p role="alert" className="text-xs text-destructive">
                  {errors.sectorId}
                </p>
              ) : null}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="plate">Placa</Label>
              <Input
                id="plate"
                name="plate"
                value={draft.plate}
                placeholder="ABC1D23"
                maxLength={10}
                autoCapitalize="characters"
                aria-invalid={errors.plate ? true : undefined}
                onChange={(event) => handleChange("plate", event.target.value)}
              />
              {errors.plate ? (
                <p role="alert" className="text-xs text-destructive">
                  {errors.plate}
                </p>
              ) : null}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="expectedArrivalAt">Chegada prevista</Label>
              <Input
                id="expectedArrivalAt"
                name="expectedArrivalAt"
                type="datetime-local"
                value={draft.expectedArrivalAt}
                aria-invalid={errors.expectedArrivalAt ? true : undefined}
                onChange={(event) =>
                  handleChange("expectedArrivalAt", event.target.value)
                }
              />
              {errors.expectedArrivalAt ? (
                <p role="alert" className="text-xs text-destructive">
                  {errors.expectedArrivalAt}
                </p>
              ) : null}
            </div>
          </form>
        ) : (
          <p className="text-sm text-muted-foreground">
            Nenhum setor está lotado no momento. Com cota disponível a reserva
            é feita direto, sem fila.
          </p>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          {hasJoinableSector ? (
            <Button type="submit" form="join-waitlist-form">
              Entrar na fila
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
