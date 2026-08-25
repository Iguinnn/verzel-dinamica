const dateTimeFormatter = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

/** Formata um instante ISO como data e hora no fuso da aplicação. */
export function formatEventDateTime(occurredAt: string): string {
  return dateTimeFormatter.format(new Date(occurredAt));
}
