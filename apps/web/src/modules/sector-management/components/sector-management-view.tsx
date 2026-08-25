"use client";

import * as React from "react";
import { PlusIcon } from "lucide-react";

import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { PageHeader } from "@/components/common/page-header";
import { PageShell } from "@/components/common/page-shell";
import { Button } from "@/components/ui/button";
import { mockSectors } from "@/modules/sector-management/mock-data";
import {
  createSectorFromDraft,
  mergeDraftIntoSector,
} from "@/modules/sector-management/sector-form";
import { SectorFormDialog } from "@/modules/sector-management/components/sector-form-dialog";
import { SectorSummaryCards } from "@/modules/sector-management/components/sector-summary-cards";
import { SectorTable } from "@/modules/sector-management/components/sector-table";
import type {
  Sector,
  SectorDraft,
} from "@/modules/sector-management/types";

/** Diálogo aberto no momento. Só um por vez. */
type DialogState =
  | { kind: "none" }
  | { kind: "create" }
  | { kind: "edit"; sector: Sector }
  | { kind: "confirmSave"; sector: Sector; draft: SectorDraft }
  | { kind: "confirmDelete"; sector: Sector };

const closed: DialogState = { kind: "none" };

/**
 * Tela de gestão de setores (ESTC-1). Restrita a administradores.
 *
 * A listagem vive em estado local: cadastrar, editar e excluir atualizam o
 * array e o React re-renderiza tabela e totais, sem recarregar a página.
 */
export function SectorManagementView() {
  const [sectors, setSectors] = React.useState<Sector[]>(mockSectors);
  const [dialog, setDialog] = React.useState<DialogState>(closed);

  function handleFormSubmit(draft: SectorDraft) {
    if (dialog.kind === "edit") {
      // A edição só é aplicada depois da confirmação.
      setDialog({ kind: "confirmSave", sector: dialog.sector, draft });
      return;
    }

    setSectors((current) => [...current, createSectorFromDraft(draft)]);
    setDialog(closed);
  }

  function confirmSave(sector: Sector, draft: SectorDraft) {
    setSectors((current) =>
      current.map((item) =>
        item.id === sector.id ? mergeDraftIntoSector(item, draft) : item,
      ),
    );
    setDialog(closed);
  }

  function confirmDelete(sector: Sector) {
    setSectors((current) => current.filter((item) => item.id !== sector.id));
    setDialog(closed);
  }

  return (
    <PageShell>
      <PageHeader
        title="Gestão de Setores"
        description="Gerencie as áreas, cotas e tarifas do estacionamento."
        actions={
          <Button onClick={() => setDialog({ kind: "create" })}>
            <PlusIcon data-icon="inline-start" />
            Novo Setor
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,15rem)_1fr]">
        <SectorSummaryCards sectors={sectors} />
        <SectorTable
          sectors={sectors}
          onEdit={(sector) => setDialog({ kind: "edit", sector })}
          onDelete={(sector) => setDialog({ kind: "confirmDelete", sector })}
        />
      </div>

      {dialog.kind === "create" || dialog.kind === "edit" ? (
        <SectorFormDialog
          onOpenChange={(open) => !open && setDialog(closed)}
          sector={dialog.kind === "edit" ? dialog.sector : undefined}
          onSubmit={handleFormSubmit}
        />
      ) : null}

      <ConfirmDialog
        open={dialog.kind === "confirmSave"}
        onOpenChange={(open) => !open && setDialog(closed)}
        title="Salvar alterações?"
        description={
          dialog.kind === "confirmSave"
            ? `Os dados de ${dialog.sector.name} serão atualizados.`
            : ""
        }
        confirmLabel="Salvar alterações"
        onConfirm={() =>
          dialog.kind === "confirmSave" &&
          confirmSave(dialog.sector, dialog.draft)
        }
      />

      <ConfirmDialog
        open={dialog.kind === "confirmDelete"}
        onOpenChange={(open) => !open && setDialog(closed)}
        title="Excluir setor?"
        description={
          dialog.kind === "confirmDelete"
            ? `${dialog.sector.name} será removido da listagem. Esta ação não pode ser desfeita.`
            : ""
        }
        confirmLabel="Excluir setor"
        destructive
        onConfirm={() =>
          dialog.kind === "confirmDelete" && confirmDelete(dialog.sector)
        }
      />
    </PageShell>
  );
}
