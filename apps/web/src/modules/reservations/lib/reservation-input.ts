/**
 * Validacao local da reserva.
 *
 * TODO(backend): a dev da ESTC-2 esta publicando `POST /v1/reservations` junto
 * com o schema Zod em `@parking/contracts`. Quando subir, este arquivo some e
 * o modal passa a validar com o schema dela. Ate la a checagem vive aqui,
 * porque `apps/web` nao declara `zod` como dependencia.
 */

/** Placa Mercosul (`ABC1D23`) e o padrao antigo (`ABC1234`). */
export const PLATE_PATTERN = /^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/;

export type ReservationInput = {
  sectorId: string;
  plate: string;
  expectedArrivalAt: string;
};

export type ReservationValidation =
  | { ok: true; value: ReservationInput }
  | { ok: false; message: string };

/** Remove pontuacao e aplica maiuscula antes de comparar com o padrao. */
export function normalizePlate(value: string): string {
  return value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
}

/**
 * Devolve o payload normalizado ou a primeira mensagem de erro, na ordem em
 * que os campos aparecem no modal.
 */
export function validateReservationInput(
  input: ReservationInput,
): ReservationValidation {
  const plate = normalizePlate(input.plate);

  if (plate.length === 0) {
    return { ok: false, message: "Placa e obrigatoria." };
  }

  if (!PLATE_PATTERN.test(plate)) {
    return {
      ok: false,
      message: "Placa deve seguir o padrao ABC1D23 ou ABC1234.",
    };
  }

  const arrival = new Date(input.expectedArrivalAt);

  if (Number.isNaN(arrival.getTime())) {
    return { ok: false, message: "Previsao de chegada invalida." };
  }

  if (arrival.getTime() < Date.now()) {
    return {
      ok: false,
      message: "Previsao de chegada nao pode estar no passado.",
    };
  }

  return {
    ok: true,
    value: {
      sectorId: input.sectorId,
      plate,
      expectedArrivalAt: arrival.toISOString(),
    },
  };
}
