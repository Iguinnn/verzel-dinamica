import type { Sector } from "@parking/contracts";

export type { Sector };

/** Situação de lotação derivada da ocupação do setor. */
export type SectorStatus = "livre" | "atencao" | "lotado";

/**
 * Valores crus do formulário de cadastro.
 *
 * Os campos numéricos ficam como texto porque é isso que o input entrega — a
 * conversão acontece na validação, junto com a checagem de formato.
 */
export type SectorDraft = {
  name: string;
  location: string;
  capacity: string;
  hourlyRate: string;
};

export type SectorDraftErrors = Partial<Record<keyof SectorDraft, string>>;

export const emptySectorDraft: SectorDraft = {
  name: "",
  location: "",
  capacity: "",
  hourlyRate: "",
};
