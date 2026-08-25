import type {
  WaitlistDraft,
  WaitlistDraftErrors,
  WaitlistEntry,
} from "@/modules/waitlist/types";

/**
 * Regras de entrada na fila da ESTC-4.
 *
 * TODO(backend): mover para `@parking/contracts` quando a API existir. A
 * unicidade real é garantida no banco pelos índices parciais
 * `reservations_active_plate_unique` e
 * `reservations_waitlisted_sector_plate_unique`; aqui a checagem existe para
 * dar a mensagem na tela antes do round-trip.
 */
export const waitlistFormMessages = {
  sectorRequired: "Selecione o setor.",
  plateRequired: "Informe a placa do veículo.",
  plateHasActiveReservation:
    "Esta placa já tem uma reserva ativa e não pode entrar na lista de espera.",
  plateAlreadyInQueue:
    "Esta placa já está na lista de espera deste setor.",
  arrivalRequired: "Informe a data e hora previstas de chegada.",
  arrivalInPast: "A chegada prevista precisa estar no futuro.",
} as const;

/** Deixa a placa em maiúsculas e sem pontuação, como manda o MER. */
export function normalizePlate(value: string): string {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

type ValidationContext = {
  /** Placas com reserva `ACTIVE` no momento. */
  activePlates: string[];
  /** Todas as entradas de fila conhecidas. */
  entries: WaitlistEntry[];
  /** Instante usado para comparar a chegada prevista. */
  now: Date;
};

/** Retorna os erros por campo. Objeto vazio significa rascunho válido. */
export function validateWaitlistDraft(
  draft: WaitlistDraft,
  { activePlates, entries, now }: ValidationContext,
): WaitlistDraftErrors {
  const errors: WaitlistDraftErrors = {};
  const plate = normalizePlate(draft.plate);

  if (draft.sectorId.length === 0) {
    errors.sectorId = waitlistFormMessages.sectorRequired;
  }

  if (plate.length === 0) {
    errors.plate = waitlistFormMessages.plateRequired;
  } else if (activePlates.includes(plate)) {
    errors.plate = waitlistFormMessages.plateHasActiveReservation;
  } else if (isPlateInSectorQueue(entries, draft.sectorId, plate)) {
    errors.plate = waitlistFormMessages.plateAlreadyInQueue;
  }

  if (draft.expectedArrivalAt.length === 0) {
    errors.expectedArrivalAt = waitlistFormMessages.arrivalRequired;
  } else if (new Date(draft.expectedArrivalAt) <= now) {
    errors.expectedArrivalAt = waitlistFormMessages.arrivalInPast;
  }

  return errors;
}

function isPlateInSectorQueue(
  entries: WaitlistEntry[],
  sectorId: string,
  plate: string,
): boolean {
  return entries.some(
    (entry) =>
      entry.sectorId === sectorId &&
      entry.status === "WAITING" &&
      entry.plate === plate,
  );
}

/** Monta a entrada de fila a partir de um rascunho já validado. */
export function createWaitlistEntry(
  draft: WaitlistDraft,
  userId: string,
  joinedAt: string,
): WaitlistEntry {
  return {
    id: crypto.randomUUID(),
    reservationId: crypto.randomUUID(),
    sectorId: draft.sectorId,
    userId,
    plate: normalizePlate(draft.plate),
    expectedArrivalAt: new Date(draft.expectedArrivalAt).toISOString(),
    joinedAt,
    status: "WAITING",
  };
}
