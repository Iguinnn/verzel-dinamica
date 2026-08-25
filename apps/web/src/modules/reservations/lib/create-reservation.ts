import type { ReservationInput } from "@/modules/reservations/lib/reservation-input";

/**
 * TODO(backend): substituir o corpo abaixo por `POST ${API_URL}/v1/reservations`.
 *
 * Este e o unico ponto de contato entre a tela de reservas e a persistencia.
 * A rota esta sendo escrita na ESTC-2; enquanto ela nao sobe, confirmar vale so
 * pelo estado local do board. Ligar o backend significa reescrever este corpo e
 * mais nada:
 *
 *   export async function confirmReservation(input: ReservationInput) {
 *     await fetch("/api/reservations", {
 *       method: "POST",
 *       headers: { "content-type": "application/json" },
 *       body: JSON.stringify(input),
 *     });
 *   }
 *
 * Nenhum componente muda quando isso acontecer. O payload ja chega aqui
 * normalizado por `validateReservationInput`.
 */
export async function confirmReservation(
  input: ReservationInput,
): Promise<void> {
  // Sem rota para chamar ainda: o payload validado morre aqui e a cota do card
  // e atualizada pelo board. A linha abaixo sai junto com o `fetch`.
  void input;
}
