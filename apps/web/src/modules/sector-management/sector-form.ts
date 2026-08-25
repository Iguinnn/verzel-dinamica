import type { CreateSectorInput } from "@parking/contracts";

import type {
  Sector,
  SectorDraft,
  SectorDraftErrors,
} from "@/modules/sector-management/types";

/**
 * Regras de cadastro da ESTC-1.
 *
 * A API repete a validação com os schemas de `@parking/contracts`; estas
 * mensagens mantêm o retorno por campo antes do envio.
 */
export const sectorFormMessages = {
  nameRequired: "Informe o nome do setor.",
  locationRequired: "Informe a localização do setor.",
  capacityInvalid: "Informe um número inteiro de vagas.",
  capacityTooLow: "A cota deve ser de no mínimo 1 vaga.",
  hourlyRateInvalid: "Informe um valor numérico para a tarifa.",
  hourlyRateNegative: "A tarifa por hora não pode ser negativa.",
} as const;

/** Converte texto do formulário em número, aceitando vírgula decimal. */
function parseNumber(value: string): number {
  return Number(value.trim().replace(",", "."));
}

/**
 * Retorna os erros por campo. Objeto vazio significa rascunho válido.
 *
 * Na edição, `minimumCapacity` impede que a cota fique abaixo das vagas já
 * ocupadas — o contrato exige `availableSpots <= capacity`.
 */
export function validateSectorDraft(
  draft: SectorDraft,
  { minimumCapacity = 1 }: { minimumCapacity?: number } = {},
): SectorDraftErrors {
  const errors: SectorDraftErrors = {};

  if (draft.name.trim().length === 0) {
    errors.name = sectorFormMessages.nameRequired;
  }

  if (draft.location.trim().length === 0) {
    errors.location = sectorFormMessages.locationRequired;
  }

  const capacity = parseNumber(draft.capacity);

  if (draft.capacity.trim().length === 0 || !Number.isInteger(capacity)) {
    errors.capacity = sectorFormMessages.capacityInvalid;
  } else if (capacity < 1) {
    errors.capacity = sectorFormMessages.capacityTooLow;
  } else if (capacity < minimumCapacity) {
    errors.capacity = `O setor já tem ${minimumCapacity} vagas ocupadas. A cota não pode ser menor.`;
  }

  const hourlyRate = parseNumber(draft.hourlyRate);

  if (draft.hourlyRate.trim().length === 0 || Number.isNaN(hourlyRate)) {
    errors.hourlyRate = sectorFormMessages.hourlyRateInvalid;
  } else if (hourlyRate < 0) {
    errors.hourlyRate = sectorFormMessages.hourlyRateNegative;
  }

  return errors;
}

/** Preenche o formulário a partir de um setor existente. */
export function toSectorDraft(sector: Sector): SectorDraft {
  return {
    name: sector.name,
    location: sector.location,
    capacity: String(sector.capacity),
    hourlyRate: String(sector.hourlyRate).replace(".", ","),
  };
}

/** Converte um rascunho válido para o contrato enviado ao BFF. */
export function toSectorInput(draft: SectorDraft): CreateSectorInput {
  return {
    name: draft.name.trim(),
    location: draft.location.trim(),
    capacity: parseNumber(draft.capacity),
    hourlyRate: parseNumber(draft.hourlyRate),
  };
}
