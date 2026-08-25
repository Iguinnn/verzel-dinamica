const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

/** Formata a tarifa por hora no padrão brasileiro. */
export function formatHourlyRate(value: number): string {
  return currencyFormatter.format(value);
}
