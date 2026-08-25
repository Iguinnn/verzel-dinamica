import type { Sector, WaitlistEntry } from "@parking/contracts";

export type { Sector, WaitlistEntry };

/** Fila de um setor, como a tela renderiza. */
export type SectorQueue = {
  sector: Sector;
  entries: WaitlistEntry[];
};

/** Valores crus do formulário de entrada na fila. */
export type WaitlistDraft = {
  sectorId: string;
  plate: string;
  /** Valor de um `<input type="datetime-local">`. */
  expectedArrivalAt: string;
};

export type WaitlistDraftErrors = Partial<Record<keyof WaitlistDraft, string>>;

export const emptyWaitlistDraft: WaitlistDraft = {
  sectorId: "",
  plate: "",
  expectedArrivalAt: "",
};

/**
 * Só setor sem cota aceita entrada na fila. A API recusa com
 * `SECTOR_HAS_AVAILABILITY`; aqui a regra só desabilita a opção no formulário.
 */
export function isSectorJoinable(sector: Sector): boolean {
  return sector.availableSpots === 0;
}

/**
 * Campos obrigatórios do formulário.
 *
 * As regras de negócio (placa com reserva ativa, entrada duplicada, chegada no
 * passado, setor com vaga) são do backend e chegam como mensagem de erro.
 */
export function validateWaitlistDraft(
  draft: WaitlistDraft,
): WaitlistDraftErrors {
  const errors: WaitlistDraftErrors = {};

  if (draft.sectorId.length === 0) {
    errors.sectorId = "Selecione o setor.";
  }

  if (draft.plate.trim().length === 0) {
    errors.plate = "Informe a placa do veículo.";
  }

  if (draft.expectedArrivalAt.length === 0) {
    errors.expectedArrivalAt = "Informe a data e hora previstas de chegada.";
  }

  return errors;
}
