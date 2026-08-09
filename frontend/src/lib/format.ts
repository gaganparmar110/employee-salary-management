// Locale-aware currency formatting (commas, correct decimal conventions
// per currency — e.g. JPY has none) via the built-in Intl API, so report
// numbers read like money instead of raw floats.
export function formatMoney(amount: number, currency: string): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}
