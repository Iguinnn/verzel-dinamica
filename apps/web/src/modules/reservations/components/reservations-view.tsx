import { PageHeader } from "@/components/common/page-header";
import { PageShell } from "@/components/common/page-shell";
import { SectorApiError, listSectors } from "@/lib/server/sectors";
import { SectorBoard } from "@/modules/reservations/components/sector-board";

/** Terminal de reservas: ocupacao por setor e abertura de uma nova reserva. */
export async function ReservationsView() {
  let sectors;
  let loadError: string | null = null;

  try {
    sectors = (await listSectors()).data;
  } catch (cause) {
    loadError =
      cause instanceof SectorApiError
        ? cause.message
        : "Nao foi possivel conectar a API de setores.";
  }

  return (
    <PageShell>
      <PageHeader
        title="Reservas"
        description="Acompanhe a ocupacao de cada setor e reserve uma vaga."
      />

      {loadError ? (
        <p
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/10 p-6 text-sm text-destructive"
        >
          {loadError}
        </p>
      ) : sectors && sectors.length > 0 ? (
        <SectorBoard sectors={sectors} />
      ) : (
        <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          Nenhum setor cadastrado ainda. Cadastre um setor para liberar reservas.
        </p>
      )}
    </PageShell>
  );
}
