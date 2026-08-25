import type { CreateReservationInput } from "@parking/contracts";

/**
 * Erro de negocio devolvido pelo BFF, ja com mensagem pronta para a tela.
 * O contrato e validado no servidor por `POST /api/reservations`, entao a
 * mensagem aqui vem de `createReservationSchema` ou da propria API Express.
 */
export class ReservationRequestError extends Error {}

function messageFrom(body: unknown): string {
  if (
    typeof body === "object" &&
    body !== null &&
    "error" in body &&
    typeof (body as { error: unknown }).error === "object" &&
    (body as { error: unknown }).error !== null
  ) {
    const { message } = (body as { error: { message?: unknown } }).error;

    if (typeof message === "string" && message.length > 0) {
      return message;
    }
  }

  return "Nao foi possivel confirmar a reserva.";
}

/** Cria a reserva pelo BFF, que repassa a sessao para a API Express. */
export async function confirmReservation(
  input: CreateReservationInput,
): Promise<void> {
  const response = await fetch("/api/reservations", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const body: unknown = await response.json().catch(() => undefined);
    throw new ReservationRequestError(messageFrom(body));
  }
}
