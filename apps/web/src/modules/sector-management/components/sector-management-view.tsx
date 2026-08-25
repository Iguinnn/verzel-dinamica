"use client";

import * as React from "react";
import { PlusIcon } from "lucide-react";

import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { PageHeader } from "@/components/common/page-header";
import { PageShell } from "@/components/common/page-shell";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  createSector,
  deleteSector,
  listSectors,
  updateSector,
} from "@/modules/sector-management/sector-api";
import { toSectorInput } from "@/modules/sector-management/sector-form";
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

type LoadState =
  | { status: "loading" }
  | { status: "ready" }
  | { status: "error"; message: string };

type PendingAction = "none" | "create" | "update" | "delete";

function errorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "Não foi possível concluir a operação.";
}

function loadingState() {
  return (
    <Card aria-busy="true" aria-label="Carregando setores">
      <CardHeader>
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-4 w-56" />
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-10 w-full" />
        ))}
      </CardContent>
    </Card>
  );
}

function errorState(message: string, onRetry: () => void) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Não foi possível carregar os setores</CardTitle>
        <CardDescription>{message}</CardDescription>
      </CardHeader>
      <CardFooter>
        <Button type="button" variant="outline" onClick={onRetry}>
          Tentar novamente
        </Button>
      </CardFooter>
    </Card>
  );
}

/**
 * Tela de gestão de setores (ESTC-1). Restrita a administradores.
 *
 * A listagem e as mutações usam o BFF de setores. As respostas são refletidas
 * no estado local sem exigir recarregamento manual da página.
 */
export function SectorManagementView() {
  const [sectors, setSectors] = React.useState<Sector[]>([]);
  const [loadState, setLoadState] = React.useState<LoadState>({
    status: "loading",
  });
  const [requestId, setRequestId] = React.useState(0);
  const [dialog, setDialog] = React.useState<DialogState>(closed);
  const [pendingAction, setPendingAction] =
    React.useState<PendingAction>("none");
  const [actionError, setActionError] = React.useState<string>();

  React.useEffect(() => {
    const controller = new AbortController();

    void listSectors(controller.signal).then(
      (data) => {
        setSectors(data);
        setLoadState({ status: "ready" });
      },
      (error: unknown) => {
        if (!controller.signal.aborted) {
          setLoadState({ status: "error", message: errorMessage(error) });
        }
      },
    );

    return () => controller.abort();
  }, [requestId]);

  function openDialog(nextDialog: DialogState) {
    setActionError(undefined);
    setDialog(nextDialog);
  }

  function handleFormSubmit(draft: SectorDraft) {
    if (dialog.kind === "edit") {
      openDialog({ kind: "confirmSave", sector: dialog.sector, draft });
      return;
    }

    void createFromDraft(draft);
  }

  async function createFromDraft(draft: SectorDraft) {
    setPendingAction("create");
    setActionError(undefined);

    try {
      const sector = await createSector(toSectorInput(draft));
      setSectors((current) => [...current, sector]);
      setDialog(closed);
    } catch (error) {
      setActionError(errorMessage(error));
    } finally {
      setPendingAction("none");
    }
  }

  async function confirmSave(sector: Sector, draft: SectorDraft) {
    setPendingAction("update");
    setActionError(undefined);

    try {
      const updated = await updateSector(sector.id, toSectorInput(draft));
      setSectors((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
      setDialog(closed);
    } catch (error) {
      setActionError(errorMessage(error));
    } finally {
      setPendingAction("none");
    }
  }

  async function confirmDelete(sector: Sector) {
    setPendingAction("delete");
    setActionError(undefined);

    try {
      await deleteSector(sector.id);
      setSectors((current) => current.filter((item) => item.id !== sector.id));
      setDialog(closed);
    } catch (error) {
      setActionError(errorMessage(error));
    } finally {
      setPendingAction("none");
    }
  }

  let content: React.ReactNode;
  if (loadState.status === "loading") {
    content = loadingState();
  } else if (loadState.status === "error") {
    content = errorState(loadState.message, () => {
      setLoadState({ status: "loading" });
      setRequestId((current) => current + 1);
    });
  } else {
    content = (
      <div className="grid gap-4 lg:grid-cols-[minmax(0,15rem)_1fr]">
        <SectorSummaryCards sectors={sectors} />
        <SectorTable
          sectors={sectors}
          onEdit={(sector) => openDialog({ kind: "edit", sector })}
          onDelete={(sector) => openDialog({ kind: "confirmDelete", sector })}
        />
      </div>
    );
  }

  return (
    <PageShell>
      <PageHeader
        title="Gestão de Setores"
        description="Gerencie as áreas, cotas e tarifas do estacionamento."
        actions={
          <Button
            disabled={loadState.status !== "ready"}
            onClick={() => openDialog({ kind: "create" })}
          >
            <PlusIcon data-icon="inline-start" />
            Novo Setor
          </Button>
        }
      />

      {content}

      {dialog.kind === "create" || dialog.kind === "edit" ? (
        <SectorFormDialog
          onOpenChange={(open) =>
            !open && pendingAction === "none" && setDialog(closed)
          }
          sector={dialog.kind === "edit" ? dialog.sector : undefined}
          pending={pendingAction === "create"}
          error={actionError}
          onSubmit={handleFormSubmit}
        />
      ) : null}

      <ConfirmDialog
        open={dialog.kind === "confirmSave"}
        onOpenChange={(open) =>
          !open && pendingAction === "none" && setDialog(closed)
        }
        title="Salvar alterações?"
        description={
          dialog.kind === "confirmSave"
            ? `Os dados de ${dialog.sector.name} serão atualizados.`
            : ""
        }
        confirmLabel="Salvar alterações"
        pending={pendingAction === "update"}
        error={actionError}
        onConfirm={() =>
          dialog.kind === "confirmSave" &&
          void confirmSave(dialog.sector, dialog.draft)
        }
      />

      <ConfirmDialog
        open={dialog.kind === "confirmDelete"}
        onOpenChange={(open) =>
          !open && pendingAction === "none" && setDialog(closed)
        }
        title="Excluir setor?"
        description={
          dialog.kind === "confirmDelete"
            ? `${dialog.sector.name} será removido da listagem. Esta ação não pode ser desfeita.`
            : ""
        }
        confirmLabel="Excluir setor"
        destructive
        pending={pendingAction === "delete"}
        error={actionError}
        onConfirm={() =>
          dialog.kind === "confirmDelete" && void confirmDelete(dialog.sector)
        }
      />
    </PageShell>
  );
}
