"use client";

import * as React from "react";
import { PlusIcon } from "lucide-react";

import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { PageHeader } from "@/components/common/page-header";
import { PageShell } from "@/components/common/page-shell";
import { Button } from "@/components/ui/button";
import { mockSectors } from "@/lib/mock/sectors";
import {
  createMockWaitlistEntries,
  mockActivePlates,
} from "@/modules/waitlist/mock-data";
import { createWaitlistEntry } from "@/modules/waitlist/waitlist-form";
import {
  groupQueuesBySector,
  leaveQueue,
} from "@/modules/waitlist/waitlist-queue";
import { JoinWaitlistDialog } from "@/modules/waitlist/components/join-waitlist-dialog";
import { SectorWaitlistCard } from "@/modules/waitlist/components/sector-waitlist-card";
import type {
  WaitlistDraft,
  WaitlistEntry,
} from "@/modules/waitlist/types";

/** Diálogo aberto no momento. Só um por vez. */
type DialogState =
  | { kind: "none" }
  | { kind: "join" }
  | { kind: "confirmLeave"; entry: WaitlistEntry };

const closed: DialogState = { kind: "none" };

/**
 * Lista de espera por setor (ESTC-4), na visão do motorista.
 *
 * Entrar e sair da fila não alteram a cota do setor — a fila só reordena quem
 * espera. A posição não é armazenada: vem da ordenação FIFO, então quem sai
 * faz os seguintes avançarem naturalmente.
 */
export function WaitlistView({ currentUserId }: { currentUserId: string }) {
  const [entries, setEntries] = React.useState<WaitlistEntry[]>(() =>
    createMockWaitlistEntries(currentUserId),
  );
  const [dialog, setDialog] = React.useState<DialogState>(closed);

  const queues = groupQueuesBySector(mockSectors, entries);

  function handleJoin(draft: WaitlistDraft) {
    const entry = createWaitlistEntry(
      draft,
      currentUserId,
      new Date().toISOString(),
    );

    setEntries((current) => [...current, entry]);
    setDialog(closed);
  }

  function confirmLeave(entry: WaitlistEntry) {
    setEntries((current) =>
      leaveQueue(current, entry.id, new Date().toISOString()),
    );
    setDialog(closed);
  }

  return (
    <PageShell>
      <PageHeader
        title="Lista de espera"
        description="Acompanhe a fila de cada setor e entre na lista quando não houver vaga."
        actions={
          <Button onClick={() => setDialog({ kind: "join" })}>
            <PlusIcon data-icon="inline-start" />
            Entrar na fila
          </Button>
        }
      />

      <div className="flex flex-col gap-4">
        {queues.map((queue) => (
          <SectorWaitlistCard
            key={queue.sector.id}
            queue={queue}
            currentUserId={currentUserId}
            onLeave={(entry) => setDialog({ kind: "confirmLeave", entry })}
          />
        ))}
      </div>

      {dialog.kind === "join" ? (
        <JoinWaitlistDialog
          onOpenChange={(open) => !open && setDialog(closed)}
          sectors={mockSectors}
          activePlates={mockActivePlates}
          entries={entries}
          onSubmit={handleJoin}
        />
      ) : null}

      <ConfirmDialog
        open={dialog.kind === "confirmLeave"}
        onOpenChange={(open) => !open && setDialog(closed)}
        title="Sair da lista de espera?"
        description={
          dialog.kind === "confirmLeave"
            ? `A placa ${dialog.entry.plate} perde a vez e as seguintes avançam na fila.`
            : ""
        }
        confirmLabel="Sair da fila"
        destructive
        onConfirm={() =>
          dialog.kind === "confirmLeave" && confirmLeave(dialog.entry)
        }
      />
    </PageShell>
  );
}
