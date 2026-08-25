"use client";

import * as React from "react";
import { PlusIcon } from "lucide-react";

import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { PageHeader } from "@/components/common/page-header";
import { PageShell } from "@/components/common/page-shell";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  joinWaitlist,
  leaveWaitlist,
  listSectorWaitlist,
  listSectors,
} from "@/modules/waitlist/waitlist-api";
import { JoinWaitlistDialog } from "@/modules/waitlist/components/join-waitlist-dialog";
import { SectorWaitlistCard } from "@/modules/waitlist/components/sector-waitlist-card";
import type {
  SectorQueue,
  WaitlistDraft,
  WaitlistEntry,
} from "@/modules/waitlist/types";

/** Diálogo aberto no momento. Só um por vez. */
type DialogState =
  | { kind: "none" }
  | { kind: "join" }
  | { kind: "confirmLeave"; entry: WaitlistEntry };

const closed: DialogState = { kind: "none" };

/** Carrega os setores e a fila de cada um, em paralelo. */
async function loadQueues(signal?: AbortSignal): Promise<SectorQueue[]> {
  const sectors = await listSectors(signal);

  return Promise.all(
    sectors.map(async (sector) => ({
      sector,
      entries: await listSectorWaitlist(sector.id, signal),
    })),
  );
}

/**
 * Lista de espera por setor (ESTC-4), na visão do motorista.
 *
 * Ordem, posição, mascaramento de placa e todas as regras de recusa são do
 * backend. A tela renderiza o resultado e mostra a mensagem de erro da API.
 */
export function WaitlistView() {
  const [queues, setQueues] = React.useState<SectorQueue[] | null>(null);
  const [loadError, setLoadError] = React.useState<string>();
  const [dialog, setDialog] = React.useState<DialogState>(closed);
  const [pending, setPending] = React.useState(false);
  const [actionError, setActionError] = React.useState<string>();

  const refresh = React.useCallback(async (signal?: AbortSignal) => {
    try {
      setQueues(await loadQueues(signal));
      setLoadError(undefined);
    } catch (error) {
      if (!signal?.aborted) {
        setLoadError(
          error instanceof Error
            ? error.message
            : "Não foi possível carregar a lista de espera.",
        );
      }
    }
  }, []);

  React.useEffect(() => {
    const controller = new AbortController();
    // A regra mira setState síncrono; aqui ele só ocorre depois do await do
    // fetch, que é o carregamento inicial normal da tela.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh(controller.signal);
    return () => controller.abort();
  }, [refresh]);

  async function handleJoin(draft: WaitlistDraft) {
    setPending(true);
    setActionError(undefined);

    try {
      await joinWaitlist(draft.sectorId, {
        plate: draft.plate,
        expectedArrivalAt: new Date(draft.expectedArrivalAt).toISOString(),
      });
      await refresh();
      setDialog(closed);
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Não foi possível entrar na fila.",
      );
    } finally {
      setPending(false);
    }
  }

  async function confirmLeave(entry: WaitlistEntry) {
    setPending(true);
    setActionError(undefined);

    try {
      await leaveWaitlist(entry.id);
      await refresh();
      setDialog(closed);
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Não foi possível sair da fila.",
      );
    } finally {
      setPending(false);
    }
  }

  const sectors = queues?.map((queue) => queue.sector) ?? [];

  return (
    <PageShell>
      <PageHeader
        title="Lista de espera"
        description="Acompanhe a fila de cada setor e entre na lista quando não houver vaga."
        actions={
          <Button
            disabled={queues === null}
            onClick={() => {
              setActionError(undefined);
              setDialog({ kind: "join" });
            }}
          >
            <PlusIcon data-icon="inline-start" />
            Entrar na fila
          </Button>
        }
      />

      {loadError ? (
        <p role="alert" className="text-sm text-destructive">
          {loadError}
        </p>
      ) : null}

      <div className="flex flex-col gap-4">
        {queues === null
          ? Array.from({ length: 3 }, (_, index) => (
              <Skeleton key={index} className="h-40 w-full rounded-xl" />
            ))
          : queues.map((queue) => (
              <SectorWaitlistCard
                key={queue.sector.id}
                queue={queue}
                onLeave={(entry) => {
                  setActionError(undefined);
                  setDialog({ kind: "confirmLeave", entry });
                }}
              />
            ))}
      </div>

      {dialog.kind === "join" ? (
        <JoinWaitlistDialog
          onOpenChange={(open) => !open && setDialog(closed)}
          sectors={sectors}
          pending={pending}
          error={actionError}
          onSubmit={handleJoin}
        />
      ) : null}

      <ConfirmDialog
        open={dialog.kind === "confirmLeave"}
        onOpenChange={(open) => !open && setDialog(closed)}
        title="Sair da lista de espera?"
        description={
          dialog.kind === "confirmLeave"
            ? `A placa ${dialog.entry.maskedPlate} perde a vez e as seguintes avançam na fila.`
            : ""
        }
        confirmLabel="Sair da fila"
        destructive
        onConfirm={() =>
          dialog.kind === "confirmLeave" && void confirmLeave(dialog.entry)
        }
      />
    </PageShell>
  );
}
