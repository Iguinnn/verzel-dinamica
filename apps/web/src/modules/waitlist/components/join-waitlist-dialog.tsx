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
  emptyWaitlistDraft,
  isSectorJoinable,
  validateWaitlistDraft,
  type Sector,
  type WaitlistDraft,
  type WaitlistDraftErrors,
} from "@/modules/waitlist/types";

type JoinWaitlistDialogProps = {
  onOpenChange: (open: boolean) => void;
  /**
   * Todos os setores do pátio. A lista aparece inteira para dar contexto, mas
   * só os lotados são selecionáveis — com cota livre a reserva é direta.
   */
  sectors: Sector[];
  pending?: boolean;
  /** Mensagem devolvida pela API na última tentativa. */
  error?: string;
  onSubmit: (draft: WaitlistDraft) => void;
};

/** Formulário de entrada na lista de espera. */
export function JoinWaitlistDialog({
  onOpenChange,
  sectors,
  pending = false,
  error,
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

    const nextErrors = validateWaitlistDraft(draft);

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    onSubmit(draft);
  }

  const hasJoinableSector = sectors.some(isSectorJoinable);

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Entrar na lista de espera</DialogTitle>
          <DialogDescription>
            Entrar na fila não consome vaga. Você é contemplado automaticamente
            quando alguém cancelar.
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
              {/*
                Select nativo em vez do primitivo shadcn: aquele portaliza o
                popup para fora do Dialog, e o clique na opção é lido como
                clique externo, fechando o diálogo inteiro.
              */}
              <select
                id="sectorId"
                name="sectorId"
                value={draft.sectorId}
                disabled={pending}
                aria-invalid={errors.sectorId ? true : undefined}
                onChange={(event) =>
                  handleChange("sectorId", event.target.value)
                }
                className="ds-select h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:bg-input/30"
              >
                <option value="">Selecione o setor lotado</option>
                {sectors.map((sector) => {
                  const isFull = isSectorJoinable(sector);

                  return (
                    <option key={sector.id} value={sector.id} disabled={!isFull}>
                      {sector.name} —{" "}
                      {isFull ? "lotado" : `${sector.availableSpots} vagas livres`}
                    </option>
                  );
                })}
              </select>
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
                disabled={pending}
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
                disabled={pending}
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
            Nenhum setor está lotado no momento. Com cota disponível a reserva é
            feita direto, sem fila.
          </p>
        )}

        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}

        <DialogFooter>
          <Button
            variant="outline"
            disabled={pending}
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          {hasJoinableSector ? (
            <Button type="submit" form="join-waitlist-form" disabled={pending}>
              {pending ? "Entrando..." : "Entrar na fila"}
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
