import { mockSectors } from "@/lib/mock/sectors";
import type { WaitlistEntry } from "@/modules/waitlist/types";

const [, , fullSector] = mockSectors;

/**
 * Placas com reserva `ACTIVE`.
 *
 * Alimenta a recusa "placa que já tem reserva ativa não entra na fila". Use
 * `ABC1D23` no formulário para ver a mensagem.
 *
 * TODO(backend): virá da consulta de reservas ativas do usuário.
 */
export const mockActivePlates: string[] = ["ABC1D23", "XYZ9K88"];

/**
 * Fila inicial do setor lotado.
 *
 * A segunda entrada é atribuída ao usuário da sessão para que "Você" e "Sair
 * da fila" sejam demonstráveis com qualquer conta — o id real só é conhecido
 * depois do login, então o fixture o recebe por parâmetro.
 *
 * Só o setor lotado tem gente esperando: com cota livre o motorista reserva
 * direto, então os demais setores exercitam o estado vazio.
 *
 * Datas são fixas para não divergir entre servidor e cliente na hidratação.
 *
 * TODO(backend): substituir pela consulta da fila por setor.
 */
export function createMockWaitlistEntries(
  currentUserId: string,
): WaitlistEntry[] {
  const sectorId = fullSector?.id ?? "";

  return [
    {
      id: "11111111-1111-4111-8111-111111111111",
      reservationId: "21111111-1111-4111-8111-111111111111",
      sectorId,
      userId: "9f8e7d6c-5b4a-4938-8271-605f4e3d2c1b",
      plate: "RJT2A45",
      expectedArrivalAt: "2026-08-26T13:00:00.000Z",
      joinedAt: "2026-08-25T09:12:00.000Z",
      status: "WAITING",
    },
    {
      id: "22222222-2222-4222-8222-222222222222",
      reservationId: "32222222-2222-4222-8222-222222222222",
      sectorId,
      userId: currentUserId,
      plate: "MNP4C67",
      expectedArrivalAt: "2026-08-26T14:30:00.000Z",
      joinedAt: "2026-08-25T09:41:00.000Z",
      status: "WAITING",
    },
    {
      id: "33333333-3333-4333-8333-333333333333",
      reservationId: "43333333-3333-4333-8333-333333333333",
      sectorId,
      userId: "7c6b5a49-3827-4160-9f5e-4d3c2b1a0987",
      plate: "QWE8F12",
      expectedArrivalAt: "2026-08-26T16:00:00.000Z",
      joinedAt: "2026-08-25T10:05:00.000Z",
      status: "WAITING",
    },
  ];
}
